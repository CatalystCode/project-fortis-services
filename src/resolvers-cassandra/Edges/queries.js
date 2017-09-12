'use strict';

const Promise = require('promise');
const moment = require('moment');
const Long = require('cassandra-driver').types.Long;
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { tilesForBbox, withRunTime, withCsvExporter, toConjunctionTopics, fromTopicListToConjunctionTopics } = require('../shared');
const { makeSet, makeMap, aggregateBy } = require('../../utils/collections');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');

const MaxFetchedRows = 10000;

/**
 * @param {{limit: Int!, fromDate: String!, periodType: String!, toDate: String!, externalsourceid: String!, pipelinekeys: [String]!, bbox: [Float]}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, mentions: number, placeid: string, avgsentiment: float}>}>}
 */
function popularLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const fetchSize = 400;
    const responseSize = args.limit || 5;

    const query = `
    SELECT mentioncount, placeid, mentioncount, avgsentimentnumerator
    FROM fortis.popularplaces
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND tilez = ?
    AND perioddate <= '${args.toDate}'
    AND perioddate >= '${args.fromDate}'
    AND tileid IN ?
    LIMIT ?
    `.trim();

    const params = [
      args.periodType,
      ...toConjunctionTopics(args.maintopic, args.conjunctivetopics),
      args.pipelinekeys,
      args.externalsourceid,
      args.zoomLevel,
      tilesForBbox(args.bbox, args.zoomLevel).map(tile => tile.id),
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
      .then(rows => {
        const placeIds = Array.from(makeSet(rows, row => row.placeid));

        if (placeIds.length) {
          featureServiceClient.fetchById(placeIds, 'bbox')
            .then(features => {
              const placeIdToFeature = makeMap(features, feature => feature.id, feature => feature);
              const edges = rows.map(row => ({
                name: placeIdToFeature[row.placeid].name,
                mentioncount: row.mentioncount,
                layer: placeIdToFeature[row.placeid].layer,
                placeid: row.placeid,
                avgsentimentnumerator: row.avgsentimentnumerator,
                bbox: placeIdToFeature[row.placeid].bbox
              }));

              resolve({
                edges: aggregateBy(edges, row => `${row.placeid}`, row => ({
                  name: row.name,
                  coordinates: row.coordinates,
                  bbox: row.bbox,
                  placeid: row.placeid,
                  mentions: Long.ZERO,
                  layer: row.layer,
                  avgsentimentnumerator: Long.ZERO
                }))
                  .slice(0, responseSize)
              });
            })
            .catch(reject);
        } else {
          resolve({ edges: [] });
        }
      });
  });
}

/**
 * @param {{fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, maintopics: [String]!, conjunctivetopics: [String], bbox: [Float], zoomLevel: Int, externalsourceid: String!}} args
 * @returns {Promise.<{labels: Array<{name: string, mentions: number}>, graphData: Array<{date: string, edges: string[], mentions: number[]}>}>}
 */
function timeSeries(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const conjunctivetopics = args.maintopics.length > 1 ? [] : args.conjunctivetopics;

    const MaxConjunctiveTopicsAllowed = 2;
    const dateFormat = 'YYYY-MM-DD HH:mm';

    const query = `
    SELECT conjunctiontopic1, conjunctiontopic2, conjunctiontopic3, perioddate, mentioncount, avgsentimentnumerator, tileid
    FROM fortis.computedtiles
    WHERE periodtype = ?
    AND conjunctiontopic1 IN ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND tilez = ?
    AND perioddate <= '${args.toDate}'
    AND perioddate >= '${args.fromDate}'
    AND tileid IN ?
    `.trim();

    const params = [
      args.periodType,
      args.maintopics,
      ...fromTopicListToConjunctionTopics(conjunctivetopics, MaxConjunctiveTopicsAllowed),
      args.pipelinekeys,
      args.externalsourceid,
      args.zoomLevel,
      tilesForBbox(args.bbox, args.zoomLevel).map(tile => tile.id)
    ];

    return cassandraConnector.executeQuery(query, params)
      .then(rows => {
        const labels = Array.from(makeSet(rows, row => row.conjunctiontopic1)).map(row => ({ name: row }));
        const tiles = Array.from(makeSet(rows, row => row.tileid)).map(row => row);
        const graphData = aggregateBy(rows, row => `${row.conjunctiontopic1}_${row.perioddate}`, row => ({
          date: moment(row.perioddate).format(dateFormat),
          name: row.conjunctiontopic1,
          mentions: Long.ZERO,
          avgsentimentnumerator: Long.ZERO
        }));
        resolve({
          labels,
          graphData,
          tiles
        });
      })
      .catch(reject);
  });
}

/**
 * @param {{bbox: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{name: string, coordinates: number[]}>}>}
 */
function locations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const { bbox } = args;

    featureServiceClient.fetchByBbox({ north: bbox[0], west: bbox[1], south: bbox[2], east: bbox[3] }, 'bbox')
      .then(locations => {
        const places = locations.map(location => ({ name: location.name, placeid: location.id, layer: location.layer, bbox: location.bbox }));
        resolve({
          places
        });
      })
      .catch(reject);
  });
}

/**
 * @param {{limit: Int!, fromDate: String!, periodType: String!, toDate: String!, externalsourceid: String!, pipelinekeys: [String]!, bbox: [Float], zoomLevel: Int}} args
 * @returns {Promise.<{edges: Array<{name: string, mentions: number, avgsentiment: float}>}>}
 */
function topTerms(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const fetchSize = 400;
    const responseSize = args.limit || 5;

    const query = `
    SELECT mentioncount, conjunctiontopic1, avgsentimentnumerator
    FROM fortis.populartopics
    WHERE periodtype = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND tilez = ?
    AND perioddate <= '${args.toDate}'
    AND perioddate >= '${args.fromDate}'
    AND tileid IN ?
    LIMIT ?
    `.trim();

    //todo: figure out why node driver timezone conversion is filtering out a majority of records
    const params = [
      args.periodType,
      args.pipelinekeys,
      args.externalsourceid,
      args.zoomLevel,
      tilesForBbox(args.bbox, args.zoomLevel).map(tile => tile.id),
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
      .then(rows =>
        resolve({
          edges: aggregateBy(rows, row => `${row.conjunctiontopic1}`, row => ({
            name: row.conjunctiontopic1,
            mentions: Long.ZERO,
            avgsentimentnumerator: Long.ZERO
          }))
            .slice(0, responseSize)
        })
      )
      .catch(reject);
  });
}

/**
 * @param {{limit: Int!, fromDate: String!, periodType: String!, toDate: String!, pipelinekeys: [String]!, conjunctivetopics: [String]!, bbox: [Float], zoomLevel: Int}} args
 * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
 */
function topSources(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const fetchSize = 400;
    const responseSize = args.limit || 5;

    const query = `
    SELECT mentioncount, pipelinekey, externalsourceid, avgsentimentnumerator
    FROM fortis.popularsources
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND pipelinekey IN ?
    AND tilez = ?
    AND perioddate <= '${args.toDate}'
    AND perioddate >= '${args.fromDate}'
    AND tileid IN ?
    LIMIT ?
    `.trim();

    const params = [
      args.periodType,
      ...toConjunctionTopics(args.maintopic, args.conjunctivetopics),
      args.pipelinekeys,
      args.zoomLevel,
      tilesForBbox(args.bbox, args.zoomLevel).map(tile => tile.id),
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
      .then(rows => {
        const filteredRows = rows.filter(row => row.pipelinekey !== 'all' && row.externalsourceid !== 'all');//filter all aggregates as we're interested in named sources only
        const edges = aggregateBy(filteredRows, row => `${row.pipelinekey}_${row.externalsourceid}`, row => ({
          pipelinekey: row.pipelinekey,
          name: row.externalsourceid,
          mentions: Long.ZERO,
          avgsentimentnumerator: Long.ZERO
        }))
          .slice(0, responseSize);

        resolve({
          edges
        });
      })
      .catch(reject);
  });
}

/**
 * @param {{fromDate: String!, periodType: String!, toDate: String!, externalsourceid: String!, pipelinekeys: [String]!, maintopic: String!, bbox: [Float], zoomLevel: Int!}} args
 * @returns {Promise.<{sources: Array<{Name: string, Count: number, Source: string}>}>}
 */
function conjunctiveTopics(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const fetchSize = 400;

    const query = `
    SELECT mentioncount, conjunctivetopic, topic
    FROM fortis.conjunctivetopics
    WHERE periodtype = ?
    AND topic = ?
    AND tilez = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND perioddate <= '${args.toDate}'
    AND perioddate >= '${args.fromDate}'
    AND tileid IN ?
    LIMIT ?
    `.trim();

    const params = [
      args.periodType,
      args.maintopic,
      args.zoomLevel,
      args.pipelinekeys,
      args.externalsourceid,
      tilesForBbox(args.bbox, args.zoomLevel).map(tile => tile.id),
      MaxFetchedRows
    ];

    return cassandraConnector.executeQuery(query, params, { fetchSize })
      .then(rows => {
        const filteredRows = rows.filter(topic=>topic.conjunctivetopic.toLowerCase() !== args.maintopic.toLowerCase());
        //todo: need to add sentiment field to the conjunctivetopics table
        const edges = aggregateBy(filteredRows, row => `${row.conjunctivetopic}`, row => ({
          conjunctionterm: row.conjunctivetopic,
          name: row.topic,
          mentions: Long.ZERO
        }));

        resolve({
          edges
        });
      })
      .catch(reject);
  });
}

module.exports = {
  popularLocations: trackEvent(withRunTime(withCsvExporter(popularLocations, 'edges')), 'popularLocations'),
  timeSeries: trackEvent(withCsvExporter(timeSeries, 'graphData'), 'timeSeries'),
  topTerms: trackEvent(withCsvExporter(topTerms, 'edges'), 'topTerms'),
  geofenceplaces: trackEvent(withRunTime(withCsvExporter(locations, 'places')), 'locations'),
  conjunctiveTopics: trackEvent(withCsvExporter(conjunctiveTopics, 'edges'), 'conjunctiveTopics'),
  topSources: trackEvent(withCsvExporter(topSources, 'edges'), 'topSources')
};