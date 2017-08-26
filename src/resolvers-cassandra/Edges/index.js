'use strict';

const queries = require('./queries');

module.exports = {
  popularLocations: queries.popularLocations,
  timeSeries: queries.timeSeries,
  topSources: queries.topSources,
  topTerms: queries.topTerms
};
