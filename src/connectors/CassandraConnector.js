'use strict';
const loggingClient = require('../loggingClient/LoggingClient');
const Promise = require('bluebird');
const cassandra = Promise.promisifyAll(require('cassandra-driver'));

const iclient = loggingClient.getClient();

const CASSANDRA_CONTACT_POINTS = process.env.CASSANDRA_CONTACT_POINTS;
const options = {
  contactPoints: [CASSANDRA_CONTACT_POINTS],
  keyspace: process.env.CASSANDRA_KEYSPACE
};

module.exports = {

  openClient: () => {
    const client = new cassandra.Client(options);

    return new Promise((resolve, reject) => {
      let start = Date.now();
      client.connect()
        .then(() => {
          let duration = Date.now() - start;
          iclient.trackEvent('Cassandra connection time', {runTime: duration});
          resolve(client);
        })
        .catch((err) => {
          iclient.trackException(err);
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