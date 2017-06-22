'use strict';

const Promise = require('bluebird');
const blobStorageManager = require('../storageClients/BlobStorageManager');

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