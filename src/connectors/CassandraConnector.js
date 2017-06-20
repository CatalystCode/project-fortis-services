"use strict"

const cassandra = require('cassandra-driver');

const CASSANDRA_CONTACT_POINTS = ['1.2.3.4']; //TODO: get from env var

const options = {
  contactPoints:CASSANDRA_CONTACT_POINTS

};

module.exports = {
  getClient: function (contactPoints, keyspace) {
    const client = new cassandra.Client({ contactPoints: contactPoints, keyspace: keyspace }); //http://docs.datastax.com/en/developer/nodejs-driver/3.2/api/type.ClientOptions/

    client.connect(function (err) {
      if (err) return console.error(err);
      console.log('Connected to cluster with %d host(s): %j', client.hosts.length, client.hosts.keys);
    });
  }
}

/* TODO ***********************************
Add app insights for reporting errors:
Connecting to cassandra
Failed storage mutations
*/

//let appInsights = require("applicationinsights");
//let appInsightsClient = appInsights.getClient();