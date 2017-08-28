'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const Long = require('cassandra-driver').types.Long;
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { tilesForBbox, tilesForLocations, parseFromToDate, withRunTime, toConjunctionTopics, toPipelineKey } = require('../shared');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');
const { makeSet, computeWeightedAvg } = require('../../utils/collections');

/**
 * @param {{tilex: number, tiley: number, tilez: number, avgsentimentnumerator: number, mentioncount: number}} rows
 */
function heatmapToFeatures(feature) {
  const heatmap = feature.heatmap ? JSON.parse(feature.heatmap) : {};
  const tileIds = Object.keys(heatmap);
  const type = 'Point';
  
  return tileIds.map(tileId => {
    const { mentioncountagg, avgsentimentagg } = heatmap[tileId];
    const mentions = Long.fromInt(mentioncountagg);
    const avgsentiment = Long.fromInt(avgsentimentagg);
    const date = feature.periodstartdate;
    const { row, column, zoom } = geotile.tileFromTileId(tileId);
    const coordinates = [geotile.longitudeFromColumn(column, zoom), geotile.latitudeFromRow(row, zoom)];
    const properties = {
      mentions: mentioncountagg,
      avgsentiment: computeWeightedAvg(mentions, avgsentiment),
      date: date,
      tilex: column,
      tiley: row,
      tilez: zoom
    };

    return { properties, coordinates, type };
  });
}

function queryHeatmapTilesByParentTile(args) {
  return new Promise((resolve, reject) => {
    const type = "FeatureCollection";
    const query = `
    SELECT heatmap, periodstartdate
    FROM fortis.heatmap
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND tilex = ?
    AND tiley = ?
    AND pipelinekey IN ?
    AND externalsourceid = ?
    AND (periodstartdate, periodenddate) <= (?, ?)
    AND (periodstartdate, periodenddate) >= (?, ?)
    `.trim();

    const params = [
      args.periodType,
      ...toConjunctionTopics(args.maintopic, args.conjunctivetopics),
      args.zoomLevel,
      args.tilex,
      args.tiley,
      args.pipelinekeys,
      args.externalsourceid,
      args.toDate,
      args.toDate,
      args.fromDate,
      args.fromDate
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => resolve({
        type: type,
        features: [].concat.apply([], rows.map(heatmapToFeatures))
      })
    )
    .catch(reject);
  });
}

/**
 * @param {{site: string, bbox: number[], mainEdge: string, filteredEdges: string[], zoomLevel: number, sourceFilter: string[], fromDate: string, toDate: string, originalSource: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function heatmapFeaturesByTile(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {    
    queryHeatmapTilesByParentTile(args)
    .then(features => resolve(features) )
    .catch(reject);
  });
}

/**
 * @param {{site: string, locations: number[][], filteredEdges: string[], timespan: string, sourceFilter: string, fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.locations || !args.locations.length) return reject('No locations for which to fetch tiles specified');
    if (!args || args.zoomLevel == null) return reject('No zoom level for which to fetch tiles specified');
    if (!args || !args.mainEdge) return reject('No main edge for keyword filter specified');
    if (!args || !args.filteredEdges) return reject('No secondary edges for keyword filter specified');
    if (!args || !args.fromDate || !args.toDate) return reject('No time period for which to fetch edges specified');

    const tiles = tilesForLocations(args.locations, args.zoomLevel);
    queryComputedTiles(tiles, args)
    .then((features) => {

      resolve({
        features
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, bbox: number[], zoom: number}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{coordinate: number[], name: string, id: string, population: number, kind: string, tileId: string, source: string>}>}
 */
function fetchPlacesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.bbox) return reject('No bounding box for which to fetch places specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch places specified');

    featureServiceClient.fetchByBbox({north: args.bbox[0], west: args.bbox[1], south: args.bbox[2], east: args.bbox[3]}, 'bbox')
    .then(places => {
      const features = places.map(place => ({coordinate: place.bbox, name: place.name, id: place.id}));
      const bbox = args.bbox;

      resolve({
        features,
        bbox
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, locations: number[][], timespan: string, sourceFilter: string[], fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.mainEdge) return reject('No main edge for which to fetch edges specified');
    if (!args || args.zoomLevel == null) return reject('No zoom level for which to fetch edges specified');
    if (!args || !args.fromDate || !args.toDate) return reject('No time period for which to fetch edges specified');
    if (!args || !args.locations || !args.locations.length) return reject('No locations for which to fetch edges specified');

    const tiles = tilesForLocations(args.locations, args.zoomLevel);
    queryPopularTopics(tiles, args)
    .then((edges) => {
      resolve({
        edges
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, bbox: number[], zoomLevel: number, mainEdge: string, timespan: string, sourceFilter: string[], fromDate: string, toDate: string, originalSource: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.mainEdge) return reject('No main edge for which to fetch edges specified');
    if (!args || args.zoomLevel == null) return reject('No zoom level for which to fetch edges specified');
    if (!args || !args.fromDate || !args.toDate) return reject('No time period for which to fetch edges specified');
    if (!args || !args.bbox) return reject('No bounding box for which to fetch edges specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch edges specified');

    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    queryPopularTopics(tiles, args)
    .then((edges) => {
      resolve({
        edges
      });
    })
    .catch(reject);
  });
}

module.exports = {
  heatmapFeaturesByTile: trackEvent(withRunTime(heatmapFeaturesByTile), 'heatmapFeaturesByTile'),
  fetchTilesByLocations: trackEvent(withRunTime(fetchTilesByLocations), 'fetchTilesByLocations'),
};
