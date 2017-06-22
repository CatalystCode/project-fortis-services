let assert = require('assert');
let blobStorageManager = require("../src/storageClients/BlobStorageManager");
let chai = require("chai");
let expect = require('chai').expect;
let Promise = require('promise');

const CONTAINER_NAME = "settings";

describe('BlobStorageManager', function() {

  describe('#Get(containerName, blobName, id)', function() {

    /*
    it('should return a single item', function() {
      let args = {};
      args.containerName = "settings";
      args.blobName = "siteTypes/humanitarian/topics/defaultTopics.json";
      args.id = 1;
      args.prefix = "";

      return blobStorageManager.Get(args.containerName, args.blobName, args.id)
        .then(function(response) {
          expect(response).to.be.an('object');
        }).catch(function(err) {
          expect(Boolean(err)).to.be.false;
        });
    });
    */
    /*
    it('should return null', function() {
      let args = {};
      args.containerName = "settings";
      args.blobName = "siteTypes/humanitarian/topics/defaultTopics.json";
      args.id = -1; //(item does not exist)
      args.prefix = "";

      return blobStorageManager.Get(args.containerName, args.blobName, args.id)
        .then(function(response) {
          expect(Object.keys(response).length).to.equal(0);
        }).catch(function(err) {
          console.log(err);
          expect(Boolean(err)).to.be.false;
        });
    });


    it('should throw error on null container', function() {
      let args = {};
      args.containerName = null;
      args.blobName = "siteTypes/humanitarian/topics/defaultTopics.json";
      args.id = 1;
      args.prefix = "";

      return blobStorageManager.Get(args.containerName, args.blobName, args.id)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

    it('should throw error on emptystring container', function() {
      let args = {};
      args.containerName = "";
      args.blobName = "siteTypes/humanitarian/topics/defaultTopics.json";
      args.id = 1;
      args.prefix = "";

      return blobStorageManager.Get(args.containerName, args.blobName, args.id)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

    it('should throw error on null blobName', function() {
      let args = {};
      args.containerName = "settings";
      args.blobName = null;
      args.id = 1;
      args.prefix = "";

      return blobStorageManager.Get(args.containerName, args.blobName, args.id)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

    it('should throw error on emptystring blobName', function() {
      let args = {};
      args.containerName = "settings";
      args.blobName = "";
      args.id = 1;
      args.prefix = "";

      return blobStorageManager.Get(args.containerName, args.blobName, args.id)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });
    */

  });
});
