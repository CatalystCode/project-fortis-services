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
const blobStorageManager = require('../storageClients/BlobStorageManager');

module.exports = {

  get(args) {
    return new Promise((resolve, reject) => {
      let start = Date.now();
      blobStorageManager.Get(args.blobName, args.id)
        .then(topics => {
          let duration = Date.now() - start;
          iclient.trackEvent(
            'api/topics/get', 
            {
              runTime: duration, 
              request: args,
              response: topics
            }
          );
          resolve(topics);
        })
        .catch(err => {
          iclient.trackException(err);
          reject(err);
        });
    });
  },

  list(args) {
    return new Promise((resolve, reject) => {
      let start = Date.now();
      blobStorageManager.List(args.blobName)
        .then(list => {
          let duration = Date.now() - start;
          iclient.trackEvent(
            'api/topics/list', 
            {
              runTime: duration, 
              request: args,
              response: list
            }
          );
          resolve(list);
        })
        .catch(err => {
          iclient.trackException(err);
          reject(err);
        });
    });
  }

};