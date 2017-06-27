'use strict';
const BATCH_LIMIT = 10;

module.exports = {

  prepareInsertTopic: topic => {
    return {
      query: `INSERT INTO computedtopics (
        periodstartdate, 
        periodenddate, 
        periodtype,
        period, 
        pipeline, 
        sourceid,
        topic,
        topiclangcode,
        insertion_time,
        computedfeatures
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [ 
        topic.periodstartdate, 
        topic.periodenddate, 
        topic.periodtype,
        topic.period,
        topic.pipeline,
        topic.sourceid,
        topic.topic,
        topic.topiclangcode,
        topic.insertion_time,
        topic.computedfeatures
      ]
    };
  },

  batch: (client, queries) => {
    return new Promise((resolve, reject) => {
      Promise.all(chunkQueryPromises(client, queries, BATCH_LIMIT))
        .then(resolve)
        .catch(reject);
    });
  }

};

let chunkQueryPromises = (client, array, chunkSize) => {
  let promises = [];
  for ( let i = 0, j = array.length; i < j; i += chunkSize ) {
    promises.push(
      new Promise((resolve, reject) => {
        client.batch(array.slice(i, i + chunkSize), { prepare: true })
          .then(resolve)
          .catch(reject);
      })
    );
  }
  return promises;
};