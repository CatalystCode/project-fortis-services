"use strict"

//can i take the promise off here? below
var Promise = require("bluebird");

const azure = Promise.promisifyAll(require('azure-storage'));

//TODO: remove hardcoded const values:
const CONTAINER_NAME = "settings";
const CONTAINER_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=fortiscentral;AccountKey=Vwbsz5N5rvGJc9eXjmqbkD20yFod4CaNa131pQf2o5Els3xsEzYo4UI4nl2KaBypNMLBlHXewJPWYEVghSICCg==;EndpointSuffix=core.windows.net";

module.exports = {

  Get: function(containerName, blobName, id) {
    let blobSvc = azure.createBlobService(CONTAINER_STORAGE_CONNECTION_STRING);
    return new Promise((resolve, reject) => {
      blobSvc.getBlobToTextAsync(containerName, blobName, null)
        .then(text => {
          resolve(JSON.parse(text)[id]);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  List: function(containerName, blobName) {
    let blobSvc = azure.createBlobService(CONTAINER_STORAGE_CONNECTION_STRING);
    return new Promise((resolve, reject) => {
      blobSvc.getBlobToTextAsync(containerName, blobName, null)
        .then(text => {
          return JSON.parse(text);
        })
        .then(list => {
          resolve({'collection': list});
        })
        .catch(err => {
          reject(err);
        });
    });
  }

}