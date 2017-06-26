'use strict';

const Promise = require('bluebird');
const cassandra = Promise.promisifyAll(require('cassandra-driver'));

const CASSANDRA_CONTACT_POINTS = process.env.CASSANDRA_CONTACT_POINTS;

const options = {
  contactPoints: [CASSANDRA_CONTACT_POINTS],
  keyspace: process.env.CASSANDRA_KEYSPACE
};

module.exports = {

  openClient: () => {
    const client = new cassandra.Client(options);

    return new Promise((resolve, reject) => {
      client.connect()
        .then(() => {
          resolve(client);
        })
        .catch((err) => {
          client.shutdown();
          reject(err);
        });
    });
  },

  closeClient: client => {
    return new Promise((resolve, reject) => {
      client.shutdown()
        .then(resolve)
        .catch(reject);
    });
  }
};