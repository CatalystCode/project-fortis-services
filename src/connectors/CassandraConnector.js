'use strict';

const Promise = require('bluebird');
const cassandra = Promise.promisifyAll(require('cassandra-driver'));

const CASSANDRA_CONTACT_POINTS = process.env.CASSANDRA_CONTACT_POINTS;

const options = {
    contactPoints: [CASSANDRA_CONTACT_POINTS],
    keyspace: process.env.CASSANDRA_KEYSPACE
};

module.exports = {

    openClient: function () {
        const client = new cassandra.Client(options);

        return new Promise((resolve, reject) => {
            client.connect()
        .then(() => {
          //console.log('Connected to cluster with %d host(s): %j', client.hosts.length, client.hosts.keys);
          //console.log('Keyspaces: %j', Object.keys(client.metadata.keyspaces));
            resolve(client);
        })
        .catch((err) => {
          //console.error('There was an error when connecting to cluster with %d host(s): %j', client.hosts.length, client.hosts.keys, err);
            client.shutdown();
            reject(null);
        });
        });
    },

    closeClient: function(client) {
        return new Promise((resolve, reject) => {
            client.shutdown()
        .then(() => {
            resolve();
        })
        .catch((err) => {
          //console.error('There was an error shutting down the client');
            reject(err);
        });
        });
    }
};