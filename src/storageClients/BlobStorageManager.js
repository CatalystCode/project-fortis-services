'use strict';

const Promise = require('bluebird');
const azure = Promise.promisifyAll(require('azure-storage'));

const BLOB_STORAGE_CONNECTION_STRING = process.env.BLOB_STORAGE_CONNECTION_STRING;

module.exports = {

    Get: function(containerName, blobName, id) {
        let blobSvc = azure.createBlobService(BLOB_STORAGE_CONNECTION_STRING);
        return new Promise((resolve, reject) => {
            blobSvc.getBlobToTextAsync(containerName, blobName, null)
        .then(text => {
            let item = JSON.parse(text)[id];
            if(item) {
                resolve(JSON.parse(text)[id]);
            } else {
                resolve(null);
            }
        })
        .catch(err => {
            reject(err);
        });
        });
    },

    List: function(containerName, blobNames) {
        let blobSvc = azure.createBlobService(BLOB_STORAGE_CONNECTION_STRING);
        return new Promise((resolve, reject) => {
            Promise.all(getListPromises(containerName, blobNames))
        .then(itemsArrays => {
            let mergedItems = [].concat.apply([], itemsArrays);
            let list = {'collection': mergedItems};
            resolve(list);
        })
        .catch(err => {
            reject(err);
        });
        });
    },

    getBlobNamesWithSiteType: function(containerName, siteType) {
        return new Promise((resolve, reject) => {
            listBlobsInContainer(containerName)
        .then(blobNames => {
            blobNames = blobNames.filter(blobNames => (blobNames.indexOf(siteType) > -1));
            resolve(blobNames);
        })
        .catch(err => {
            reject(err);
        });
        });
    }

};

let getListPromises = (containerName, blobNames) => {
    let blobSvc = azure.createBlobService(BLOB_STORAGE_CONNECTION_STRING);
    let listPromises = [];
    for ( let blobName of blobNames ) {
        listPromises.push(
      new Promise((resolve, reject) => {
          blobSvc.getBlobToTextAsync(containerName, blobName, null)
          .then(JSON.parse)
          .then(list => {
              resolve(list);
          })
          .catch(err => {
              reject(err);
          });
      })
    );
    }
    return listPromises;
};

let listBlobsInContainer = containerName => {
    let blobSvc = azure.createBlobService(BLOB_STORAGE_CONNECTION_STRING);
    return new Promise((resolve, reject) => {
        blobSvc.listBlobsSegmentedAsync(containerName, null)
      .then(blobs => {
          blobs.entries = blobs.entries.map(blob => blob.name);
          resolve(blobs.entries);
      })
      .catch(err => {
          reject(err);
      });
    });
};