const blobStorageManager = require('../src/storageClients/BlobStorageManager');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const TOPIC_SEED_CONTAINER = process.env.TOPIC_SEED_CONTAINER;
const BLOB_NAME = 'siteTypes/humanitarian/topics/defaultTopics.json';
const BLOB_NAMES = ['siteTypes/humanitarian/topics/defaultTopics.json', 'siteTypes/health/topics/defaultTopics.json'];
const SITE_TYPE = 'humanitarian';

describe('BlobStorageManager', function() {

  describe('#Get(blobName, id)', function() {

    it('should return a single item', function() {
      return expect(blobStorageManager.Get(BLOB_NAME, 1)).to.eventually.be.an('object');
    });

    it('should be rejected', function() {
      return expect(blobStorageManager.Get(BLOB_NAME, -1)).to.eventually.be.rejected;
    });

    it('should throw error on null blobName', function() {
      return blobStorageManager.Get(null, 1)
        .then(response => {
          expect(response).to.be.undefined;
        }).catch(err => {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

    it('should throw error on emptystring blobName', function() {
      return blobStorageManager.Get('', 1)
        .then(response => {
          expect(response).to.be.undefined;
        }).catch(err => {
          expect(err.name).to.equal('ArgumentNullError');
        });
    });

  });

  describe('#List(blobNames)', function() {
    it('should return all items for all the blobNames', function() {
      return expect(blobStorageManager.List(BLOB_NAMES)).to.eventually.be.an('object');
    });
  });

/*
  describe('#listBlobsInContainer()', function() {
    it('should return all blobs', function() {
      return expect(blobStorageManager.listBlobsInContainer()).to.eventually.be.an('array');
    });
  });
*/
  describe('#getBlobNamesWithSiteType(siteType)', function() {
    it('should return blob names that are of a certain siteType', function() {
      return expect(blobStorageManager.getBlobNamesWithSiteType(SITE_TYPE)).to.eventually.be.an('array');
    });
  });


});
