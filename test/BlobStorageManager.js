const blobStorageManager = require('../src/storageClients/BlobStorageManager');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('BlobStorageManager', function() {

  describe('#getTopicsBySiteType(siteType, callback)', function() {
    
    it('should return all topics of siteType', function() {
      let siteType = 'humanitarian';
      return expect(blobStorageManager.getTopicsBySiteType(siteType)).to.eventually.be.a('array');
    });      

    it('should throw an error with no siteType', function() {
      let siteType = '';
      return expect(blobStorageManager.getTopicsBySiteType(siteType)).to.eventually.be.rejected;
    });     

  });

});
