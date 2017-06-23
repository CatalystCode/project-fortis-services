'use strict';
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .start();

const iclient = appInsights.getClient();

const Promise = require('bluebird');

const BATCH_LIMIT = 10;

module.exports = {

  prepareInsertTopic: topic => { //TODO: the insert statement to reflect the final topic schema
    return {
      query: 'INSERT INTO topics (id, topic, value) VALUES (?, ?, ?)',
      params: [ topic.id, topic.topic, topic.value ]
    };
  },

  batch: (client, queries) => {
    return new Promise((resolve, reject) => {
      let start = Date.now();
      Promise.all(chunkQueryPromises(client, queries, BATCH_LIMIT))
        .then(() => {
          let duration = Date.now() - start;
          iclient.trackEvent(
            'Cassandra batch', 
            {
              runTime: duration, 
              request: {
                queries: queries,
                chunkSize: BATCH_LIMIT
              }
            }
          );
          resolve();
        })
        .catch(err => {
          iclient.trackException(err);
          reject(err);
        });
    });
  }

};

let chunkQueryPromises = (client, array, chunkSize) => {
  let promises = [];
  for ( let i = 0, j = array.length; i < j; i += chunkSize ) {
    promises.push(
      new Promise((resolve, reject) => {
        client.batch(array.slice(i, i + chunkSize), { prepare: true })
          .then(resolve)
          .catch(reject);
      })
    );
  }
  return promises;
};