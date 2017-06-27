'use strict';
const loggingClient = require('../src/loggingClient/LoggingClient');
const iclient = loggingClient.getClient();
const cassandra = require('cassandra-driver');
const cassandraTableStorageManager = require('../src/storageClients/CassandraTableStorageManager');
const chai = require('chai');
const expect = chai.expect;

const queries = [
  {
    query: 'INSERT INTO Topics (id, topic, value) VALUES (?, ?, ?)',
    params: [ 1, 'toxin', 'en' ]
  },
  {
    query: 'INSERT INTO Topics (id, topic, value) VALUES (?, ?, ?)',
    params: [ 2, 'pollution', 'en' ]
  }
];

const CASSANDRA_CONTACT_POINTS = process.env.CASSANDRA_CONTACT_POINTS;

describe('CassandraTableStorageManager', function() {

  describe('#batch(queries)', function() {
    const options = {
      contactPoints: [CASSANDRA_CONTACT_POINTS],
      keyspace: process.env.CASSANDRA_KEYSPACE
    };
    const client = new cassandra.Client(options);
    const BATCH_LIMIT = 10;

    it('Cassandra client should insert items in batches without error', function() {

      return expect(loggingClient.trackEventWithDuration(iclient, 'Cassandra batch', {
        runTime: '', 
        request: {
          queries: queries,
          chunkSize: BATCH_LIMIT
        }
      }, () => Promise.all(cassandraTableStorageManager.chunkQueryPromises(client, queries, BATCH_LIMIT))))
      .to.eventually.be.fulfilled;
    });

  });

  describe('#prepareInsertTopic(topic)', function() {

    it('Prepares the query object without error', function() {

      let topic = {
        id: 1,
        topic: 'health',
        value: 'en'
      };
      
      return expect(cassandraTableStorageManager.prepareInsertTopic(topic)).to.have.property('query');
    });

  });

});