const express = require('express')
const { ApolloServer, gql, SchemaDirectiveVisitor } = require("apollo-server-express");
const { buildFederatedSchema } = require("@apollo/federation");
const { KeycloakContext, KeycloakTypeDefs, KeycloakSchemaDirectives } = require('keycloak-connect-graphql');
const { configureKeycloak } = require('./lib/common');

const app = express();
const graphqlPath = '/graphql';

const typeDefs = gql`
  ${KeycloakTypeDefs}
  extend type Query {
    me: User @auth
    hello: String @hasRole(role: "developer")
  }

  type User @key(fields: "id") {
    id: ID!
    name: String
    username: String
  }
`;

const resolvers = {
  Query: {
    me(obj, args, ctx) {
      return users[0];
    },
    hello: (obj, args, context, info) => {
      // log some of the auth related info added to the context
      // console.debug(context.kauth.accesstoken)
      // console.debug(context.kauth.isAuthenticated())
      
      let name = 'world'
      
      if (context.kauth.accessToken) {
        name = context.kauth.accessToken.content.preferred_username
      }

      return `Hello ${name}`;
    }
  },
  User: {
    __resolveReference(object, args, ctx) {
      return users.find(user => user.id === object.id);
    }
  }
};

const schema = buildFederatedSchema([ { typeDefs, resolvers } ], );

const directives = KeycloakSchemaDirectives;

SchemaDirectiveVisitor.visitSchemaDirectives(schema, directives);

const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    return {
      kauth: new KeycloakContext({ req })
    }
  }
});

const { keycloak } = configureKeycloak(app, graphqlPath);

app.use(graphqlPath, keycloak.middleware());

server.applyMiddleware({ app })

const port = 4001;
  
  app.listen({ port },() => {
    console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
  })

const users = [
  {
    id: "1",
    name: "Ada Lovelace",
    birthDate: "1815-12-10",
    username: "@ada"
  },
  {
    id: "2",
    name: "Alan Turing",
    birthDate: "1912-06-23",
    username: "@complete"
  }
];
