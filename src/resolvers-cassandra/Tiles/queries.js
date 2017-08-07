'use strict';

const Promise = require('promise');
const geotile = require('geotile');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const { fetchBboxLocations, tilesForBbox, parseFromToDate, withRunTime, toConjunctionTopics, toPipelineKey } = require('../shared');
const { trackEvent } = require('../../clients/appinsights/AppInsightsClient');
const { makeSet } = require('../../utils/collections');

/**
 * @param {{tilex: number, tiley: number, tilez: number, avgsentiment: number, mentioncount: number}} rows
 */
function computedtileToTile(row) {
  const coordinates = [geotile.longitudeFromColumn(row.tiley, row.tilez), geotile.latitudeFromRow(row.tilex, row.tilez)];
  const mentionCount = row.mentioncount;
  const neg_sentiment = row.avgsentiment;
  const tileId = geotile.tileIdFromRowColumn(row.tilex, row.tiley, row.tilez);

  return {
    coordinates,
    mentionCount,
    neg_sentiment,
    tileId
  };
}

/**
 * @param {{site: string, bbox: number[], mainEdge: string, filteredEdges: string[], zoomLevel: number, sourceFilter: string[], fromDate: string, toDate: string, originalSource: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.bbox) return reject('No bounding box for which to fetch tiles specified');
    if (!args || args.zoomLevel == null) return reject('No zoom level for which to fetch tiles specified');
    if (!args || !args.mainEdge) return reject('No main edge for keyword filter specified');
    if (!args || !args.filteredEdges) return reject('No secondary edges for keyword filter specified');
    if (!args || !args.fromDate || !args.toDate) return reject('No time period for which to fetch edges specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch tiles specified');

    const { periodType, period, fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.row);
    const tiley = makeSet(tiles, tile => tile.column);

    const query = `
    SELECT tilex, tiley, tilez, avgsentiment, mentioncount
    FROM fortis.computedtiles
    WHERE periodtype = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND tilez = ?
    AND period = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND (tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?)
    AND (tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?)
    `.trim();

    const params = [
      periodType,
      ...toConjunctionTopics(args.mainEdge, args.filteredEdges),
      args.zoomLevel,
      period,
      toPipelineKey(args.sourceFilter),
      args.originalSource || 'all',
      Math.max(...tilex),
      Math.max(...tiley),
      toDate,
      toDate,
      Math.min(...tilex),
      Math.min(...tiley),
      fromDate,
      fromDate
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => {
      resolve({
        bbox: args.bbox,
        features: rows.map(computedtileToTile)
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, locations: number[][], filteredEdges: string[], timespan: string, sourceFilter: string, fromDate: string, toDate: string}} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Array<{type: string, coordinates: number[], properties: {mentionCount: number, location: string, population: number, neg_sentiment: number, pos_sentiment: number, tileId: string}}>}>}
 */
function fetchTilesByLocations(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    return reject('Querying by location is no longer supported, please query using the place name instead');
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

    fetchBboxLocations(args.bbox)
    .then(places => {
      const features = places.map(place => ({coordinate: place.bbox, name: place.name, id: place.id}));
      resolve({
        features: features,
        bbox: args.bbox
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
    return reject('Querying by location is no longer supported, please query using the place name instead');
  });
}

/**
 * @param {{site: string, bbox: number[], zoomLevel: number, mainEdge: string, timespan: string, sourceFilter: string[], fromDate: string, toDate: string, originalSource: string}} args
 * @returns {Promise.<{runTime: string, edges: Array<{type: string, name: string, mentionCount: string}>}>}
 */
function fetchEdgesByBBox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.mainEdge) return reject('No main edge for which to fetch edges specified');
    if (!args || !args.bbox) return reject('No bounding box for which to fetch edges specified');
    if (!args || args.zoomLevel == null) return reject('No zoom level for which to fetch edges specified');
    if (!args || !args.fromDate || !args.toDate) return reject('No time period for which to fetch edges specified');
    if (args.bbox.length !== 4) return reject('Invalid bounding box for which to fetch edges specified');

    const { periodType, period, fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const tiles = tilesForBbox(args.bbox, args.zoomLevel);
    const tilex = makeSet(tiles, tile => tile.row);
    const tiley = makeSet(tiles, tile => tile.column);

    const query = `
    SELECT mentionCount, topic
    FROM fortis.populartopics
    WHERE periodtype = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND tilez = ?
    AND topic = ?
    AND period = ?
    AND (tilex, tiley, periodstartdate, periodenddate) <= (?, ?, ?, ?)
    AND (tilex, tiley, periodstartdate, periodenddate) >= (?, ?, ?, ?)
    `.trim();

    const params = [
      periodType,
      toPipelineKey(args.sourceFilter),
      args.originalSource || 'all',
      args.zoomLevel,
      args.mainEdge,
      period,
      Math.max(...tilex),
      Math.max(...tiley),
      toDate,
      toDate,
      Math.min(...tilex),
      Math.min(...tiley),
      fromDate,
      fromDate
    ];

    cassandraConnector.executeQuery(query, params)
    .then(rows => {
      resolve({
        edges: rows.map(row => ({mentionCount: row.mentionCount, name: row.topic}))
      });
    })
    .catch(reject);
  });
}

module.exports = {
  fetchTilesByBBox: trackEvent(withRunTime(fetchTilesByBBox), 'fetchTilesByBBox'),
  fetchTilesByLocations: trackEvent(withRunTime(fetchTilesByLocations), 'fetchTilesByLocations'),
  fetchPlacesByBBox: trackEvent(withRunTime(fetchPlacesByBBox), 'fetchPlacesByBBox'),
  fetchEdgesByLocations: trackEvent(withRunTime(fetchEdgesByLocations), 'fetchEdgesByLocations'),
  fetchEdgesByBBox: trackEvent(withRunTime(fetchEdgesByBBox, 'fetchEdgesByBBox'))
};
