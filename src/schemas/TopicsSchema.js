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
    getTopic(blobName: String!, id: Int!): Topic
    list(blobName: String!): TopicCollection
  }
`);