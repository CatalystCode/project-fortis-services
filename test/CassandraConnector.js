'use strict';
const cassandraConnector = require('../src/connectors/CassandraConnector');
const chai = require('chai');
const expect = require('chai').expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised); //TODO: see if you can move these test config to a new file see mocha docs

describe('Client', function() {

  describe('#executeQueries(queries, eventIdentifier)', function() {
    
    it('should resolve the promise', function() {
      let queries = [
        {
          query: 'INSERT INTO Topics (id, topic, value) VALUES (?, ?, ?)',
          params: [ 1, 'toxin', 'en' ]
        },
        {
          query: 'INSERT INTO Topics (id, topic, value) VALUES (?, ?, ?)',
          params: [ 2, 'pollution', 'en' ]
        }
      ];
      return expect(cassandraConnector.executeQueries(queries, 'settings_insert_topics_seed')).to.eventually.be.fulfilled;
    });
    
  });

});