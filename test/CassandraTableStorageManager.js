const sinon = require('sinon');
const cassandra = require('cassandra-driver');
const cassandraTableStorageManager = require('../src/storageClients/CassandraTableStorageManager');
const chai = require('chai');
const expect = require('chai').expect;
const Promise = require('bluebird');

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

        it('Cassandra client should insert items in batches without error', function() {
            return expect(cassandraTableStorageManager.batch(client, queries)).to.eventually.be.fulfilled;
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