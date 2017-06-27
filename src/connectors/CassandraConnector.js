'use strict';
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();
const iclient = appInsights.getClient();
const cassandra = require('cassandra-driver');
const cassandraTableStorageManager = require('../storageClients/CassandraTableStorageManager');
const distance = cassandra.types.distance;

/** Cassandra Client Options
 * https://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/
 */
const options = {
  contactPoints: [process.env.CASSANDRA_CONTACT_POINTS],
  keyspace: process.env.CASSANDRA_KEYSPACE,
  pooling: {
    coreConnectionsPerHost: {
      [distance.local] : 10,
      [distance.remote] : 10
    } 
  }
};

/** Code should share the same Client instance across the application
 * http://docs.datastax.com/en/developer/nodejs-driver/3.2/coding-rules/
 */
const client = new cassandra.Client(options);

module.exports = {

  /** Execute a batch of queries
   * @param Array<{query, params}> queries
   * @param String eventIdentifier  A string to identify the event for appinsights
   * @return {Promise}
   */
  executeQueries: (queries, eventIdentifier) => {
    if (!eventIdentifier || eventIdentifier === '') eventIdentifier = 'Cassandra batch';
    return new Promise((resolve, reject) => {
      let numQueries = queries.length;
      cassandraTableStorageManager.batch(client, queries)
        .then(res => {
          iclient.trackEvent(eventIdentifier, {numQueries: numQueries});
          resolve(res);
        })
        .catch(err => {
          const errMsg = `[${err}] occured while performing a batch of ${numQueries} queries`;
          console.error(errMsg);
          iclient.trackException(eventIdentifier, {error: err, numQueries: numQueries});
          client.shutdown();
          reject(errMsg);
        });
    });
  }

};