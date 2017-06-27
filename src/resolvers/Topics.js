'use strict';
const blobStorageManager = require('../storageClients/BlobStorageManager');

module.exports = {
  
  get(args) {
    return new Promise((resolve, reject) => {
      blobStorageManager.getTopic(args.blobName, args.id)
        .then(resolve)
        .catch(reject);
    });
  },

  list(args) {
    return new Promise((resolve, reject) => {
      blobStorageManager.getTopicList(args.blobName)
        .then(resolve)
        .catch(reject);
    });
  }

};

//DELETE? - blob storage manager handles this