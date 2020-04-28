const { ApolloServer, defaultPlaygroundOptions } = require("apollo-server-express");
const { ApolloGateway, RemoteGraphQLDataSource  } = require("@apollo/gateway");

const express = require('express')
const { configureKeycloak } = require('./lib/common');
const { KeycloakContext } = require('keycloak-connect-graphql');
const expressPlayground = require('graphql-playground-middleware-express').default;

const app = express();
const graphqlPath = '/graphql';
const playgroundPath = '/playground';

const gateway = new ApolloGateway({
  // This entire `serviceList` is optional when running in managed federation
  // mode, using Apollo Graph Manager as the source of truth.  In production,
  // using a single source of truth to compose a schema is recommended and
  // prevents composition failures at runtime using schema validation using
  // real usage-based metrics.
  serviceList: [
    { name: "accounts", url: "http://localhost:4001/graphql" },
    { name: "reviews", url: "http://localhost:4002/graphql" },
    { name: "products", url: "http://localhost:4003/graphql" },
    { name: "inventory", url: "http://localhost:4004/graphql" }
  ],
  buildService({ name, url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        
        // Passing Keycloak Access Token to services
        if (context.kauth && context.kauth.accessToken) {
          request.http.headers.set('Authorization', 'bearer '+ context.kauth.accessToken.token);
        }
      }
    })
  },

  // Experimental: Enabling this enables the query plan view in Playground.
  __exposeQueryPlanExperimental: false,
});

(async () => {
  // perform the standard keycloak-connect middleware setup on our app
  const { keycloak } = configureKeycloak(app, graphqlPath);
  
  // Ensure entire GraphQL Api can only be accessed by authenticated users
  app.use(playgroundPath, keycloak.protect());

  const server = new ApolloServer({
    gateway,

    // Apollo Graph Manager (previously known as Apollo Engine)
    // When enabled and an `ENGINE_API_KEY` is set in the environment,
    // provides metrics, schema management and trace reporting.
    engine: false,

    // Subscriptions are unsupported but planned for a future Gateway version.
    subscriptions: false,

    // Disable default playground
    playground: false,
    
    context: ({ req }) => {
      return {
        kauth: new KeycloakContext({ req })
      }
    }
  });
  

  // Handle custom GraphQL Playground to use dynamics header token from keycloak
  app.get(playgroundPath, (req, res, next) => {
    const headers = JSON.stringify({
      'X-CSRF-Token': req.kauth.grant.access_token.token,
    });
    expressPlayground({
      ...defaultPlaygroundOptions,
      endpoint: `${graphqlPath}?headers=${encodeURIComponent(headers)}`,
      settings: {
        ...defaultPlaygroundOptions.settings,
        'request.credentials': 'same-origin',
      },
      version: "",
      tabs: ""
    })(req, res, next);
  });

  // console.log(server);
  server.applyMiddleware({ app })
  
  // server.listen().then(({ url }) => {
  //   console.log(`🚀 Server ready at ${url}`);
  // });

  const port = 4000;
  
  app.listen({ port },() => {
    console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
  })

})();
