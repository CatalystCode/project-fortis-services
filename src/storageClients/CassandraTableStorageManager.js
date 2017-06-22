'use strict'

const cassandraConnector = require("../connectors/CassandraConnector");
const Promise = require("bluebird");

const BATCH_LIMIT = 10;

module.exports = {

  prepareInsertTopic: function(topic) { //TODO: the insert statement to reflect the final topic schema
    return {
      query: 'INSERT INTO topics (id, topic, value) VALUES (?, ?, ?)',
      params: [ topic.id, topic.topic, topic.value ]
    };
  },

  batch: function(client, queries){
    return new Promise((resolve, reject) => {
      Promise.all(getBatchPromises(client, queries))
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

}

let getBatchPromises = (client, queries) => {
  let insertPromises = [];
  for ( let i = 0, j = queries.length; i < j; i += BATCH_LIMIT ) {
    insertPromises.push(
      new Promise((resolve, reject) => {
        client.batch(queries.slice(i, i + BATCH_LIMIT), { prepare: true })
          .then(res => {
            resolve(res);
          })
          .catch(err => {
            reject(err);
          });
      })
    );
  }
  return insertPromises;
}


