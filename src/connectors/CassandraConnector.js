'use strict';
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .start();

const iclient = appInsights.getClient();

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
      let start = Date.now();
      client.connect()
        .then(() => {
          let duration = Date.now() - start;
          iclient.trackMetric('Cassandra connection time', duration);
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
    let start = Date.now();
    return new Promise((resolve, reject) => {
      client.shutdown()
        .then(() => {
          let duration = Date.now() - start;
          iclient.trackMetric('Cassandra shutdown time', duration);
          resolve();
        })
        .catch(err => {
          iclient.trackException(err);
          reject(err);
        });
    });
  }

};