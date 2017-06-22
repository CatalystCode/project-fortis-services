const cassandra = require('cassandra-driver');
const cassandraConnector = require("../src/connectors/CassandraConnector");
const chai = require("chai");
const expect = require('chai').expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised); //TODO: see if you can move these test config to a new file see mocha docs
const Promise = require("bluebird");

const CASSANDRA_CONTACT_POINTS = process.env.CASSANDRA_CONTACT_POINTS;

describe('Client', function() {

  describe('#closeClient(client)', function() {

    it('should resolve the promise with the client', function() {
      const options = {
        contactPoints: [CASSANDRA_CONTACT_POINTS],
        keyspace: process.env.CASSANDRA_KEYSPACE
      };
      const client = new cassandra.Client(options);
      return (expect(cassandraConnector.closeClient(client)).to.eventually.be.fulfilled);
    });

  });

});