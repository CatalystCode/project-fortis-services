"use strict"

let azure = require('azure-storage');
let Promise = require('promise');

//TODO: remove hardcoded const values:
const CONTAINER_NAME = "settings";
const CONTAINER_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=fortiscentral;AccountKey=Vwbsz5N5rvGJc9eXjmqbkD20yFod4CaNa131pQf2o5Els3xsEzYo4UI4nl2KaBypNMLBlHXewJPWYEVghSICCg==;EndpointSuffix=core.windows.net";

module.exports = {

  //!!!!TODO: https://softwareengineering.stackexchange.com/questions/144326/try-catch-in-javascript-isnt-it-a-good-practice
  // should i return null or {} when I don't get back anything from the get and theres no error? ill return null for now
  Get: function(containerName, blobName, id) {
    let blobSvc = azure.createBlobService(CONTAINER_STORAGE_CONNECTION_STRING); //TODO: error handle if conn str not provided
    return new Promise((resolve, reject) => {
      blobSvc.listBlobsSegmentedWithPrefix(containerName,"",null,null,(err, result) => {
        if (err || !result || !result.entries || result.entries.length == 0) {
          reject(err);
        } else {
          blobSvc.getBlobToText(containerName, blobName, null, function (error, text) {
            if (error) {
              callback(error, null);
            } else {
              try {
                let item = JSON.parse(text)[id];
                console.log("item: ", item);
                resolve(item);
              } catch (e) {
                callback(e, null);
              }
            }
          });
        }
      });
    });
  },

  //TODO:
  Fetch: function (pageSize, skip, tagFilter, callback, logger) {
          pageSize = pageSize || DEFAULT_PAGE_SIZE;
          skip = skip || DEFAULT_SKIP;

          var blobSvc = azure.createBlobService(FACTS_STORAGE_CONNECTION_STRING);
          new Promise((resolve, reject) => {
              blobSvc.listBlobsSegmented(FACTS_CONTAINER_NAME, null, (error, result, response) => {
                  if (!error) {
                      let blobs = result.entries.filter(blob => {
                          return blob.name.indexOf(".json") != -1 && blob.lastModified;
                      }).sort(function (a, b) {
                          return Date.parse(getDateFromBlobName(a.name)) < Date.parse(getDateFromBlobName(b.name)) ? 1 : -1;
                      }).slice(skip, skip + pageSize);
                      resolve(blobs);
                  }
                  else {
                      console.log(`error [${error}]`);
                      reject(error);
                  }
              });
          }).then(blobs => {
              Promise.all(getReadBlobPromises(blobs, tagFilter)).then(facts => {
                  var result = facts.filter(fact => fact).sort(function (a, b) {
                      return a.id < b.id ? 1 : -1;
                  }).slice(0, pageSize);
                  callback(result);
              });
          }).catch(error => callback(null, error));
   }

}