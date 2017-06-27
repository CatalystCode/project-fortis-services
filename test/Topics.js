'use strict';
const loggingClient = require('../src/loggingClient/LoggingClient');
const iclient = loggingClient.getClient();
const topics = require('../src/resolvers/Topics');
const chai = require('chai');
const expect = chai.expect;

const BLOB_NAME = 'siteTypes/humanitarian/topics/defaultTopics.json';
const BLOB_NAMES = ['siteTypes/humanitarian/topics/defaultTopics.json', 'siteTypes/health/topics/defaultTopics.json'];

describe('Topics', function() {

  describe('#get(args)', function() {

    it('should return a single item', function() {
      let args = {};
      args.blobName = BLOB_NAME;
      args.id = 1;
      
      return loggingClient.trackEventWithDuration(iclient, 'api/topics/get', {
        runTime: '', 
        request: args,
        response: null
      }, () => topics.get(args))
        .then(response => {
          expect(response).to.be.an('object');
        }).catch(err => {
          expect(Boolean(err)).to.be.false;
        });
    });

  });

  describe('#list(args)', function() {

    it('should return an object with key collection', function() {
      let args = {};
      args.blobName = BLOB_NAMES;

      return loggingClient.trackEventWithDuration(iclient, 'api/topics/list', {
        runTime: '', 
        request: args,
        response: null
      }, () => topics.list(args))
        .then(response => {
          expect(response).to.be.an('object');
        }).catch(err => {
          expect(Boolean(err)).to.be.false;
        });

    });

  });

});