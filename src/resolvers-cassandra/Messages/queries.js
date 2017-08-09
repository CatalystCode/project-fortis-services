'use strict';

const Promise = require('promise');
const translatorService = require('../../clients/translator/MsftTranslator');
const cassandraConnector = require('../../clients/cassandra/CassandraConnector');
const featureServiceClient = require('../../clients/locations/FeatureServiceClient');
const { parseFromToDate, withRunTime, toPipelineKey, toConjunctionTopics, limitForInClause } = require('../shared');
const { makeSet } = require('../../utils/collections');
const trackEvent = require('../../clients/appinsights/AppInsightsClient').trackEvent;

/**
 * @typedef {type: string, coordinates: number[][], properties: {edges: string[], messageid: string, createdtime: string, sentiment: number, title: string, originalSources: string[], sentence: string, language: string, source: string, properties: {retweetCount: number, fatalaties: number, userConnecionCount: number, actor1: string, actor2: string, actor1Type: string, actor2Type: string, incidentType: string, allyActor1: string, allyActor2: string, title: string, link: string, originalSources: string[]}, fullText: string}} Feature
 */

function eventToFeature(row) {
  return {
    type: row.pipelinekey,
    coordinates: [],
    properties: {
      edges: row.topics,
      messageid: row.eventid,
      createdtime: row.event_time,
      sentiment: row.computedfeatures && row.computedfeatures.sentiment,
      title: row.title,
      originalSources: row.externalsourceid,
      language: row.eventlangcode,
      source: row.sourceurl,
      fullText: row.messagebody
    }
  };
}

/**
 * @param {site: string, originalSource: string, placeId: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string, mainTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byLocation(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.placeId) return reject('Invalid place id specified');

    const { fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const limit = args.limit || 15;

    const placesQuery = `
    SELECT eventid
    FROM fortis.eventplaces
    WHERE placeid = ?
    AND conjunctiontopic1 = ?
    AND conjunctiontopic2 = ?
    AND conjunctiontopic3 = ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND eventtime <= ?
    AND eventtime >= ?
    `.trim();

    const placesParams = [
      args.placeId,
      ...toConjunctionTopics(args.mainTerm, args.filteredEdges),
      toPipelineKey(args.sourceFilter),
      'all',
      toDate,
      fromDate
    ];

    return cassandraConnector.executeQuery(placesQuery, placesParams)
    .then(rows => {
      const eventIds = makeSet(rows, row => row.eventid);

      const eventsQuery = `
      SELECT *
      FROM fortis.events
      WHERE pipelinekey = ?
      AND eventid IN ?
      AND fulltext LIKE ?
      LIMIT ?
      `.trim();

      const eventsParams = [
        toPipelineKey(args.sourceFilter),
        limitForInClause(eventIds),
        `%${args.fulltextTerm}%`,
        limit
      ];

      return cassandraConnector.executeQuery(eventsQuery, eventsParams);
    })
    .then(rows => {
      resolve({
        features: rows.map(eventToFeature)
      });
    })
    .catch(reject);
  });
}

/**
 * @param {site: string, originalSource: string, bbox: number[], mainTerm: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byBbox(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args.bbox || args.bbox.length !== 4) return reject('Invalid bbox specified');

    const { fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);

    featureServiceClient.fetchByBbox({north: args.bbox[0], west: args.bbox[1], south: args.bbox[2], east: args.bbox[3]})
    .then(places => {
      const placeIds = makeSet(places, place => place.id);
      const limit = args.limit || 15;

      const tagsQuery = `
      SELECT eventids
      FROM fortis.eventplaces
      WHERE placeid IN ?
      AND conjunctiontopic1 = ?
      AND conjunctiontopic2 = ?
      AND conjunctiontopic3 = ?
      AND pipelinekey = ?
      AND externalsourceid = ?
      AND event_time <= ?
      AND event_time >= ?
      LIMIT ?
      `.trim();

      const tagsParams = [
        limitForInClause(placeIds),
        ...toConjunctionTopics(args.mainTerm, args.filteredEdges),
        toPipelineKey(args.sourceFilter),
        'all',
        toDate,
        fromDate,
        limit
      ];

      cassandraConnector.executeQuery(tagsQuery, tagsParams)
      .then(rows => {
        const eventIds = makeSet(rows.map(row => row.eventids), eventId => eventId);

        const eventsQuery = `
        SELECT *
        FROM fortis.events
        WHERE pipelinekey = ?
        AND eventid IN ?
        AND fulltext LIKE ?
        LIMIT ?
        `.trim();

        const eventsParams = [
          toPipelineKey(args.sourceFilter),
          limitForInClause(eventIds),
          `%${args.fulltextTerm}%`,
          limit
        ];

        return cassandraConnector.executeQuery(eventsQuery, eventsParams);
      })
      .then(rows => {
        resolve({
          features: rows.map(eventToFeature)
        });
      })
      .catch(reject);
    })
    .catch(reject);
  });
}

/**
 * @param {site: string, filteredEdges: string[], langCode: string, limit: number, offset: number, fromDate: string, toDate: string, sourceFilter: string[], fulltextTerm: string} args
 * @returns {Promise.<{runTime: string, type: string, bbox: number[], features: Feature[]}>}
 */
function byEdges(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.filteredEdges || !args.filteredEdges.length) return reject('No edges by which to filter specified');

    const { fromDate, toDate } = parseFromToDate(args.fromDate, args.toDate);
    const limit = args.limit || 15;

    const tagsQuery = `
    SELECT eventids
    FROM fortis.eventtopics
    WHERE topic IN ?
    AND pipelinekey = ?
    AND externalsourceid = ?
    AND event_time <= ?
    AND event_time >= ?
    LIMIT ?
    `.trim();

    const tagsParams = [
      limitForInClause(args.filteredEdges),
      toPipelineKey(args.sourceFilter),
      'all',
      toDate,
      fromDate,
      limit
    ];

    cassandraConnector.executeQuery(tagsQuery, tagsParams)
    .then(rows => {
      const eventIds = makeSet(rows.map(row => row.eventids), eventId => eventId);

      const eventQuery = `
      SELECT *
      FROM fortis.events
      WHERE pipelinekey = ?
      AND eventid IN ?
      LIMIT ?
      `.trim();

      const eventParams = [
        toPipelineKey(args.sourceFilter),
        limitForInClause(eventIds),
        limit
      ];

      return cassandraConnector.executeQuery(eventQuery, eventParams);
    })
    .then(rows => {
      resolve({
        features: rows.map(eventToFeature)
      });
    })
    .catch(reject);
  });
}

/**
 * @param {{site: string, messageId: string}} args
 * @returns {Promise.<Feature>}
 */
function event(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    if (!args || !args.messageId) return reject('No event id to fetch specified');

    const eventQuery = `
    SELECT *
    FROM fortis.events
    WHERE eventid = ?
    AND pipelinekey = 'all'
    LIMIT 2
    `.trim();

    const eventParams = [
      args.messageId
    ];

    cassandraConnector.executeQuery(eventQuery, eventParams)
    .then(eventRows => {
      if (eventRows.length > 1) return reject(`Got more ${eventRows.length} events with id ${args.messageId}`);

      resolve(eventToFeature(eventRows[0]));
    })
    .catch(reject);
  });
}

/**
 * @param {{sentence: string, fromLanguage: string, toLanguage: string}} args
 * @returns {Promise.<{originalSentence: string, translatedSentence: string}>}
 */
function translate(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    translatorService.translate(args.sentence, args.fromLanguage, args.toLanguage)
      .then(result => resolve({ translatedSentence: result.translatedSentence, originalSentence: args.sentence }))
      .catch(reject);
  });
}

/**
 * @param {{words: string[], fromLanguage: string, toLanguage: string}} args
 * @returns {Promise.<{words: Array<{originalSentence: string, translatedSentence: string}>}>}
 */
function translateWords(args, res) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    translatorService.translateSentenceArray(args.words, args.fromLanguage, args.toLanguage)
      .then(result => resolve({ words: result.translatedSentence }))
      .catch(reject);
  });
}

module.exports = {
  byLocation: trackEvent(withRunTime(byLocation), 'messagesForLocation'),
  byBbox: trackEvent(withRunTime(byBbox), 'messagesForBbox'),
  byEdges: trackEvent(withRunTime(byEdges), 'messagesForEdges'),
  event: trackEvent(event, 'messageForEvent'),
  translate: trackEvent(translate, 'translate'),
  translateWords: trackEvent(translateWords, 'translateWords')
};
