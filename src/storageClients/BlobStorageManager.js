'use strict';
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();
const iclient = appInsights.getClient();
let request = require('request');

module.exports = {

  /** Gets an array of topics
   * @param {String} siteType
   * @returns {Promise}
  */
  getTopicsBySiteType: (siteType) => {
    return new Promise((resolve, reject) => {
      const url = `https://fortiscentral.blob.core.windows.net/settings/siteTypes/${siteType}/topics/defaultTopics.json`;

      const GET = {
        url: url,
        json: true,
        withCredentials: false
      };

      request(GET, (error, response, body) => {
        if (!error && response.statusCode === 200 && body) {
          iclient.trackEvent(`GET ${url}`);
          resolve(body);
        } else {
          const errMsg = `[${error}] occured while fetching request for url ${url}`;
          console.error(errMsg);
          iclient.trackException(errMsg);
          reject(errMsg);
        }
      });
    });
  }
};