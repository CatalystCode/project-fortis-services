'use strict';
const BATCH_LIMIT = 10;

module.exports = {

  prepareInsertTopic: topic => { //TODO: the insert statement to reflect the final topic schema
    return {
      query: 'INSERT INTO topics (id, topic, value) VALUES (?, ?, ?)',
      params: [ topic.id, topic.topic, topic.value ]
    };
  },

  chunkQueryPromises: (client, array, chunkSize) => {
    let promises = [];
    for ( let i = 0, j = array.length; i < j; i += chunkSize ) {
      promises.push(
        new Promise((resolve, reject) => {
          client.batch(array.slice(i, i + chunkSize), { prepare: true })
            .then(resolve)
            .catch(reject);
        })
      );
    }
    return promises;
  },

  batch: (client, queries) => {
    return new Promise((resolve, reject) => {
      Promise.all(this.chunkQueryPromises(client, queries, BATCH_LIMIT))
        .then(resolve)
        .catch(reject);
    });
  }

};