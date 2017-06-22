var graphql = require('graphql');
 
module.exports = graphql.buildSchema(`
  type TopicCollection {
    id: Int!,
    topic: String!,
    value: String!
  }
  
  type Query {
    get(containerName: String!, blobName: String!, id: Int!): TopicCollection
  }
`);