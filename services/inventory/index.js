const { ApolloServer, gql, SchemaDirectiveVisitor } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const { KeycloakContext, KeycloakTypeDefs, KeycloakSchemaDirectives } = require('keycloak-connect-graphql');

const typeDefs = gql`
  ${KeycloakTypeDefs}
  extend type Product @key(fields: "upc") {
    upc: String! @external
    weight: Int @external
    price: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object) {
      return {
        ...object,
        ...inventory.find(product => product.upc === object.upc)
      };
    },
    shippingEstimate(object) {
      // free for expensive items
      if (object.price > 1000) return 0;
      // estimate is based on weight
      return object.weight * 0.5;
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


server.listen({ port: 4004 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const inventory = [
  { upc: "1", inStock: true },
  { upc: "2", inStock: false },
  { upc: "3", inStock: true }
];
