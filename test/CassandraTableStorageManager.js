let assert = require('assert');
let sinon = require('sinon');
const cassandra = require('cassandra-driver');
let cassandraTableStorageManager = require("../src/storageClients/CassandraTableStorageManager");
let cassandraConnector = require("../src/connectors/CassandraConnector");

/*
describe('CassandraTableStorageManager', function() {

  describe('#insert(siteType, items)', function() {

    it('Cassandra client should insert items without error', function(done) {
      cassandraTableStorageManager.insert('humanitarian', [{RowKey: 1, name: 'topic1', value: 'topic2'}], done)
    });
  });

});
*/

/*    it('should call getClient once', function() {
      var client = sinon.spy(cassandraConnector, 'getClient');

      cassandraTableStorageManager.insert('humanitarian', [{RowKey: 1, name: 'topic1', value: 'topic2'}])

      sinon.assert.calledOnce(client);
    });*/
