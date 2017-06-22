'use strict';

const Promise = require('bluebird');
//const appInsights = require('applicationinsights');
const blobStorageManager = require('../storageClients/BlobStorageManager');

//appInsights.setup();
//appInsights.client.config.samplingPercentage = 0; // 0% of all telemetry will be sent to Application Insights 
//appInsights.start();

module.exports = {
    get(args) {
        return new Promise((resolve, reject) => {
            blobStorageManager.Get(args.containerName, args.blobName, args.id)
        .then(response => {
            resolve(response);
        }).catch(err => {
            reject(err);
        });
        });
    },
    list(args) {
        return new Promise((resolve, reject) => {
            blobStorageManager.List(args.containerName, args.blobName)
        .then(response => {
            resolve(response);
        })
        .catch(err => {
            reject(err);
        });
        });
    }
};