let assert = require('assert');
const cassandra = require('cassandra-driver');
let cassandraConnector = require("../src/connectors/CassandraConnector");

/*
describe('Client', function() {

  describe('#getClient()', function() {
    it('Get Cassandra client without error', function(done) {
      cassandraConnector.getClient(['h1, h2'], 'ks1', done)
    });
  });


});
*/