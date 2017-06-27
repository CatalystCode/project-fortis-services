'use-strict';

const ikey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
const appInsights = require('applicationinsights');

module.exports = {

  getClient() {
    if(ikey) {
      appInsights.setup(ikey).start();
      return appInsights.getClient();
    } else {
      /* For more information see:
      * https://github.com/Microsoft/ApplicationInsights-JS/blob/master/API-reference.md
      */
      return {
        
        /* User actions and other events. Used to track user behavior or to monitor performance.
        *  trackEvent(eventName: string, eventProperties?: {[string]:string})
        */
        trackEvent: (eventName, eventProperties) => console.log('Event: ' + eventName, eventProperties),
        
        /* Logging exceptions for diagnosis. Trace where they occur in relation to other events and examine stack traces.
        * trackException(exception: Error, exceptionProp?: {[string]:string})
        */
        trackException: (exception) => console.log('Exception: ', exception)

      };
    }
  },

  trackEventWithDuration(iclient, eventName, eventProperties, promiseFn) {
    return new Promise((resolve, reject) => {
      let start = Date.now();
      promiseFn()
        .then(res => {
          let duration = Date.now() - start;
          eventProperties.runTime = duration;
          eventProperties.response = res;
          iclient.trackEvent(eventName, duration);
          resolve(res);
        })
        .catch(err => {
          iclient.trackException(err);
          reject(err);
        });
    });
  }

};