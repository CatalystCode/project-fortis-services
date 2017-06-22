const settings = require('../src/resolvers/Settings');
const chai = require('chai');
const expect = require('chai').expect;
const Promise = require('bluebird');
const cassandra = require('cassandra-driver');

const CONTAINER_NAME = 'settings';
const SITE_TYPE = 'humanitarian';

describe('Settings', function() {
  //only use below test if you commentted out insertorreplacesitedef
  /*
  describe('#createOrReplaceSite(args,res)', function() {
    it('should return a resolved result', function() {
      let args = {};
      args.input = {
        targetBbox: [],
        defaultZoomLevel: 1,
        logo: "",
        title: "",
        name: "",
        defaultLocation:[],
        storageConnectionString: "",
        featuresConnectionString: "",
        mapzenApiKey: "",
        fbToken: "",
        supportedLanguages: ["en"],
        siteType: 'humanitarian'
      };
      let res = "";

      return settings.createOrReplaceSite(args, res);
    });
  })
  */

  /*
  describe('#insertSeedTopics(client, siteType)', function() {
    it('should insert topics into cassandra', function() {
      const options = {
        contactPoints: [process.env.CASSANDRA_CONTACT_POINTS],
        keyspace: process.env.CASSANDRA_KEYSPACE
      };
      const client = new cassandra.Client(options);
      return expect(settings.insertSeedTopics(client, SITE_TYPE)).to.eventually.be.fulfilled;
    });
  });
  */

});