const blobStorageManager = require("../src/storageClients/BlobStorageManager");
const chai = require("chai");
const expect = require('chai').expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const Promise = require("bluebird");

const CONTAINER_NAME = "settings";
const BLOB_NAME = "siteTypes/humanitarian/topics/defaultTopics.json";
const BLOB_NAMES = ["siteTypes/humanitarian/topics/defaultTopics.json", "siteTypes/health/topics/defaultTopics.json"];
const SITE_TYPE = "humanitarian";

describe('BlobStorageManager', function() {

  describe('#Get(containerName, blobName, id)', function() {

    it('should return a single item', function() {
      return expect(blobStorageManager.Get(CONTAINER_NAME, BLOB_NAME, 1)).to.eventually.be.an('object');
    });

    it('should return null', function() {
      return expect(blobStorageManager.Get(CONTAINER_NAME, BLOB_NAME, -1)).to.eventually.be.a('null');
    });

    it('should throw error on null container', function() {
      return blobStorageManager.Get(null, BLOB_NAME, 1)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

    it('should throw error on emptystring container', function() {
      return blobStorageManager.Get("", BLOB_NAME, 1)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

    it('should throw error on null blobName', function() {
      return blobStorageManager.Get(CONTAINER_NAME, null, 1)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

    it('should throw error on emptystring blobName', function() {
      return blobStorageManager.Get(CONTAINER_NAME, "", 1)
        .then(function(response) {
          expect(response).to.be.undefined;
        }).catch(function(err) {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

  });

  describe('#List(containerName, blobNames)', function() {
    it('should return all items for all the blobNames', function() {
      return expect(blobStorageManager.List(CONTAINER_NAME, BLOB_NAMES)).to.eventually.be.an('object');
    });
  });

/*
  describe('#listBlobsInContainer(containerName)', function() {
    it('should return all blobs', function() {
      return expect(blobStorageManager.listBlobsInContainer(CONTAINER_NAME)).to.eventually.be.an('array');
    });
  });
*/
  describe('#getBlobNamesWithSiteType(containerName, siteType)', function() {
    it('should return blob names that are of a certain siteType', function() {
      return expect(blobStorageManager.getBlobNamesWithSiteType(CONTAINER_NAME, SITE_TYPE)).to.eventually.be.an('array');
    });
  });


});
