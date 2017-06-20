"use strict"

let Promise = require('promise');
var appInsights = require('applicationinsights');
//appInsights.setup();
//appInsights.client.config.samplingPercentage = 0; // 0% of all telemetry will be sent to Application Insights 
//appInsights.start();
let blobStorageManager = require("../storageClients/BlobStorageManager");

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