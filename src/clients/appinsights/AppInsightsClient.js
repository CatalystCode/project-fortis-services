const appInsightsKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

let client;
let consoleLog = console.log;
let consoleError = console.error;
let consoleWarn = console.warn;

const TRACE_LEVEL_INFO = 1;
const TRACE_LEVEL_WARNING = 2;
const TRACE_LEVEL_ERROR = 3;

function setup() {
  if (appInsightsKey) {
    const appInsights = require('applicationinsights');
    appInsights.setup(appInsightsKey);
    appInsights.start();
    client = appInsights.getClient(appInsightsKey);
    console.log = trackTrace(TRACE_LEVEL_INFO, consoleLog);
    console.warn = trackTrace(TRACE_LEVEL_WARNING, consoleWarn);
    console.error = trackTrace(TRACE_LEVEL_ERROR, consoleError);
  }
}

function trackTrace(level, localLogger) {
  return (message) => {
    if (client) {
      client.trackTrace(message, level);
    }
    localLogger(message);
  };
}

function trackDependency(promiseFunc, dependencyName, callName) {
  function dependencyTracker(...args) {
    return new Promise((resolve, reject) => {
      const start = new Date();
      promiseFunc(...args)
      .then(returnValue => {
        const duration = new Date() - start;
        const success = true;
        if (client) {
          client.trackDependency(dependencyName, callName, duration, success);
        }
        console.log(JSON.stringify({dependency: dependencyName, call: callName, duration, success, args}));
        resolve(returnValue);
      })
      .catch(err => {
        const duration = new Date() - start;
        const success = false;
        if (client) {
          client.trackDependency(dependencyName, callName, duration, success);
        }
        console.error(JSON.stringify({dependency: dependencyName, call: callName, duration, success, err, args}));
        reject(err);
      })
      .catch(reject);
    });
  }

  return dependencyTracker;
}

function trackEvent(promiseFunc, eventName, extraPropsFunc) {
  extraPropsFunc = extraPropsFunc || ((returnValue, err) => ({})); // eslint-disable-line no-unused-vars

  function eventTracker(...args) {
    return new Promise((resolve, reject) => {
      const start = new Date();
      promiseFunc(...args)
      .then(returnValue => {
        const props = extraPropsFunc(returnValue, null);
        props.duration = new Date() - start;
        props.success = true;
        if (client) {
          client.trackEvent(eventName, props);
        }
        console.log(JSON.stringify({event: eventName, properties: props, args: args && args.length && args[0]}));
        resolve(returnValue);
      })
      .catch(err => {
        const props = extraPropsFunc(null, err);
        props.duration = new Date() - start;
        props.success = false;
        if (client) {
          client.trackEvent(eventName, props);
        }
        console.error(JSON.stringify({event: eventName, properties: props, err, args: args && args.length && args[0]}));
        reject(err);
      })
      .catch(reject);
    });
  }

  return eventTracker;
}

module.exports = {
  trackDependency: trackDependency,
  trackEvent: trackEvent,
  setup: setup
};
