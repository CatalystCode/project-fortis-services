'use strict';

const Promise = require('bluebird');
const blobStorageManager = require('../storageClients/BlobStorageManager');

module.exports = {
  get(args) {
    return new Promise((resolve, reject) => {
      blobStorageManager.Get(args.blobName, args.id)
        .then(resolve)
        .catch(reject);
    });
  },
  list(args) {
    return new Promise((resolve, reject) => {
      blobStorageManager.List(args.blobName)
        .then(resolve)
        .catch(reject);
    });
  }
};