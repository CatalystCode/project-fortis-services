let topics = require("../src/resolvers/Topics");
var chai = require("chai");
chai.should();
let expect = require('chai').expect;
let Promise = require('promise');

const CONTAINER_NAME = "settings";


describe('Topics', function() {

  describe('#get(args)', function() {

    it('should return a single item', function() {
      let args = {};
      args.containerName = "settings";
      args.blobName = "siteTypes/humanitarian/topics/defaultTopics.json";
      args.id = 1;
      args.prefix = "";

      return topics.get(args)
        .then(function(response) {
          expect(response).to.be.an('object');
        }).catch(function(err) {
          expect(Boolean(err)).to.be.false;
        });
    });

  });

  describe('#list(args)', function() {

    it('should return an array', function() {
      let args = {};
      args.containerName = "settings";
      args.blobName = "siteTypes/humanitarian/topics/defaultTopics.json";

      return topics.list(args)
        .then(function(response) {
          expect(response).to.be.an('object');
        }).catch(function(err) {
          expect(Boolean(err)).to.be.false;
        });
    });

  });

});