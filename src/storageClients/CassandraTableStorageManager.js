"use strict"

let asyncEachLimit = require('async/eachLimit');
const ASYNC_INSERT_LIMIT = 10;

const cassandraConnector = require("../connectors/CassandraConnector");

const CONTACT_POINTS = ['h1','h2'];
const KEYSPACE = 'ks1';

function processInsert(client, siteType, item, asyncCB) {
  const query = `INSERT INTO Topics (id, name, value) VALUES (?, ?, ?)`;
  const params = [ 1, "humanitarian aid", siteType ];

  // 1
  client.execute(query, params, { prepare: true })
    .then(result => console.log('inserted row with ' + params[0] + params[1] + params[2]));

  // 2
  const queries = [
    {
      query: 'UPDATE user_profiles SET email=? WHERE key=?',
      params: [ emailAddress, 'hendrix' ]
    },
    {
      query: 'INSERT INTO user_track (key, text, date) VALUES (?, ?, ?)',
      params: [ 'hendrix', 'Changed email', new Date() ]
    }
  ];
  client.batch(queries, { prepare: true })
    .then(result => console.log('Data updated on cluster'));
}

module.exports = {
  //TODO: can I generalize this beyond topics?
  insert: function(siteType, items){
    const client = cassandraConnector.getClient(CONTACT_POINTS, KEYSPACE);

    /*if db only allows a limited number of connections at a time*/
    asyncEachLimit(items, ASYNC_INSERT_LIMIT, (siteType, item, asyncCB) => processInsert(client, siteType, item, asyncCB), finalCBErr => {
      let processedInserts;
      if(finalCBErr){
        console.error(`Error occured inserting items into Topics table: ${JSON.stringify(finalCBErr)}`);
      }else{
        console.log(`Finished writing ${items.length} to Topics table`);
        processedInserts = items.map(item => item.RowKey);
      }
        callback(finalCBErr, processedInserts);
    });
  }
}

/* TODO ***********************************
Add app insights for reporting errors:
Connecting to cassandra
Failed storage mutations

Disconnect from cassandra on error
*/

//let appInsights = require("applicationinsights");
//let appInsightsClient = appInsights.getClient();