const topics = require('../src/resolvers/Topics');
const chai = require('chai');
const expect = require('chai').expect;
const Promise = require('bluebird');

const CONTAINER_NAME = 'settings';
const BLOB_NAME = 'siteTypes/humanitarian/topics/defaultTopics.json';
const BLOB_NAMES = ['siteTypes/humanitarian/topics/defaultTopics.json', 'siteTypes/health/topics/defaultTopics.json'];

describe('Topics', function() {

    describe('#get(args)', function() {

        it('should return a single item', function() {
            let args = {};
            args.containerName = CONTAINER_NAME;
            args.blobName = BLOB_NAME;
            args.id = 1;
            args.prefix = '';

            return topics.get(args)
        .then(function(response) {
            expect(response).to.be.an('object');
        }).catch(function(err) {
            expect(Boolean(err)).to.be.false;
        });
        });

    });

    describe('#list(args)', function() {

        it('should return an object with key collection', function() {
            let args = {};
            args.containerName = CONTAINER_NAME;
            args.blobName = BLOB_NAMES;

            return topics.list(args)
        .then(function(response) {
            expect(response).to.be.an('object').that.has.all.keys('collection');
        }).catch(function(err) {
            expect(Boolean(err)).to.be.false;
        });
        });

    });

});