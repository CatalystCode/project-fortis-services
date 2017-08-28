const graphql = require('graphql');

module.exports = graphql.buildSchema(`
  type Query {
    heatmapFeaturesByTile(fromDate: String!, toDate: String!, periodType: String!, pipelinekeys: [String]!, maintopic: String!, conjunctivetopics: [String], tiley: Int!, tilex: Int!, zoomLevel: Int!, externalsourceid: String!): FeatureCollection,
    fetchTilesByLocations(site: String!, locations: [[Float]]!, mainEdge: String, zoomLevel: Int, filteredEdges: [String], timespan: String!, sourceFilter: [String], fromDate: String, toDate: String): FeatureCollection,
  }

  enum TypeEnum {
    FeatureCollection
  }

  enum FeatureType {
    Point
  }

  type FeatureCollection {
    runTime: String,
    type: TypeEnum!,
    features: [Feature]!
  }

  type Feature {
    type: FeatureType,
    coordinates: [Float],
    properties: Tile!
  }

  type Tile {
    mentions: Int
    date: String
    avgsentiment: Float
    tilex: Int
    tiley: Int
    tilez: Int
  }
`);