'use strict';
const loggingClient = require('../loggingClient/LoggingClient');
const iclient = loggingClient.getClient();
const Promise = require('bluebird');
const azure = Promise.promisifyAll(require('azure-storage'));

const BLOB_STORAGE_CONNECTION_STRING = process.env.BLOB_STORAGE_CONNECTION_STRING;
const TOPIC_SEED_CONTAINER = process.env.TOPIC_SEED_CONTAINER;

module.exports = {

  getTopic: (blobPath, id) => {
    return new Promise((resolve, reject) => {
      let blobSvc = azure.createBlobService(BLOB_STORAGE_CONNECTION_STRING);
      if (!blobSvc) {
        iclient.trackException('blobsvc is null'); 
        reject('blobsvc is null');
      } else {
        blobSvc.getBlobToTextAsync(TOPIC_SEED_CONTAINER, blobPath, null)
        .then(JSON.parse)
        .then(text => {
          let item = text[id];
          if (item) resolve(item);
          else reject(null);
        })
        .catch(reject);
      }
    });
  },

  getTopicList: blobPaths => {
    return new Promise((resolve, reject) => {
      Promise.all(getListPromises(blobPaths))
        .then(itemsArrays => {
          resolve({'collection': flatten(itemsArrays)});
        })
        .catch(reject);
    });
  },

  getblobPathsWithSiteType: siteType => {
    return new Promise((resolve, reject) => {
      listBlobPathsInContainer()
        .then(blobPaths => {
          blobPaths = blobPaths.filter(blobPath => (blobPath.indexOf(siteType) > -1));
          resolve(blobPaths);
        })
        .catch(reject);
    });
  }

};

let flatten = arrayOfArrays => [].concat.apply([], arrayOfArrays);

let getListPromises = blobPaths => {
  let blobSvc = azure.createBlobService(BLOB_STORAGE_CONNECTION_STRING);
  if (!blobSvc) {
    iclient.trackException('blobsvc is null'); 
    return null;
  } else {
    let listPromises = [];
    blobPaths.map(blobPath => {
      listPromises.push(
        new Promise((resolve, reject) => {
          blobSvc.getBlobToTextAsync(TOPIC_SEED_CONTAINER, blobPath, null)
            .then(JSON.parse)
            .then(resolve)
            .catch(reject);
        })
      );
    });
    return listPromises;
  }
};

let listBlobPathsInContainer = () => {
  return new Promise((resolve, reject) => {
    let blobSvc = azure.createBlobService(BLOB_STORAGE_CONNECTION_STRING);
    if (!blobSvc) {
      iclient.trackException('blobsvc is null'); 
      reject('blobsvc is null');
    } else {
      blobSvc.listBlobsSegmentedAsync(TOPIC_SEED_CONTAINER, null)
      .then(blobs => {
        resolve(blobs.entries.map(blob => blob.name));
      })
      .catch(reject);
    }
  });
};