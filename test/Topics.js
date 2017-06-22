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
          console.log("response", response);
          expect(response).to.be.an('object');
        }).catch(function(err) {
          console.log("WUTTT", err);
          expect(Boolean(err)).to.be.false;
        });
    });

  });



});