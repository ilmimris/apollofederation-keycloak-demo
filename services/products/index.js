const { ApolloServer, gql, SchemaDirectiveVisitor } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const { KeycloakContext, KeycloakTypeDefs, KeycloakSchemaDirectives } = require('keycloak-connect-graphql');

const typeDefs = gql`
  ${KeycloakTypeDefs}
  extend type Query {
    topProducts(first: Int = 5): [Product]
  }

  type Product @key(fields: "upc") {
    upc: String!
    name: String
    price: Int # @hasRole(role: "user")
    weight: Int
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object, args, ctx, info) {
      // console.log(ctx.kauth)
      return products.find(product => product.upc === object.upc);
    }
  },
  Query: {
    topProducts(_, args, ctx) {
      return products.slice(0, args.first);
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


server.listen({ port: 4003 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const products = [
  {
    upc: "1",
    name: "Table",
    price: 899,
    weight: 100
  },
  {
    upc: "2",
    name: "Couch",
    price: 1299,
    weight: 1000
  },
  {
    upc: "3",
    name: "Chair",
    price: 54,
    weight: 50
  }
];
