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
        .then(function(response) {
          resolve(result);
        }).catch(function(err) {
          reject(err);
        });
     });
  },
  //TODO: finish writing this
   list(args) {
     const startTime = Date.now();
     return new Promise((resolve, reject) => {
       blobStorageManager.Fetch(args.pageSize, args.skip, args.tagFilter, (results, error) => {
         if (error) {
           reject(`Error occured retrieving items. [${error}]`);
         } else {
           let response = { items: results, runTime: Date.now() - startTime };
           resolve(response);
         }
       });
     });
   }
};