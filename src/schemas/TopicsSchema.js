var graphql = require('graphql');
 
module.exports = graphql.buildSchema(`

  type Topic {
    id: Int!,
    topic: String!,
    value: String!
  }

  type TopicCollection {
    collection: [Topic]!
  }
  
  type Query {
    get(containerName: String!, blobName: String!, id: Int!): Topic
    list(containerName: String!, blobName: String!): TopicCollection
  }
`);