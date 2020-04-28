## Apollo Federation with Keycloak Demo

This repository is a demo of using Apollo Federation to build a single schema on top of multiple services base from [apollographql/federation-demo](https://github.com/apollographql/federation-demo) repo. The microservices are located under the [`./services`](./services/) folder and the gateway that composes the overall schema is in the [`gateway.js`](./gateway.js) file and secure it with [Keycloak](https://github.com/aerogear/keycloak-connect-graphql). 

### Prerequisites
* Docker and docker-compose installed
* Node.js and Yarn installed

Start by cloning this repo.

```
git clone https://github.com/ilmimris/apollofederation-keycloak-demo/
```

Then start a Keycloak server using `docker-compose`.

```
cd config && docker-compose up
```

Now in a separate terminal, seed the keycloak server with a sample configuration.

```
$ yarn keycloak:seed

creating role admin
creating role developer
creating client role admin for client keycloak-connect-graphql-bearer
creating client role developer for client keycloak-connect-graphql-bearer
creating client role admin for client keycloak-connect-graphql-public
creating client role developer for client keycloak-connect-graphql-public
creating user developer with password developer
assigning client and realm roles called "developer" to user developer
creating user admin with password admin
assigning client and realm roles called "admin" to user admin
done
```

This creates a sample realm called `keycloak-connect-graphql` with some clients, roles and users that we can use in the examples.
Now we are ready to start and explore the examples.

The Keycloak console is accessible at [localhost:8080](http://localhost:8080) and the admin login is `admin/admin`. You can make any configuration changes you wish and `npm run examples:seed` will always recreate the example realm from scratch.

### Installation

To run this demo locally, run the following commands:

```sh
yarn install
```

This will install all of the dependencies for the gateway and each underlying service.

```sh
yarn start-services
```

This command will run all of the microservices at once. They can be found at http://localhost:4001, http://localhost:4002, http://localhost:4003, and http://localhost:4004.

In another terminal window, run the gateway by running this command:

```sh
yarn start-gateway
```

This will start up the gateway and serve it at http://localhost:4000

### What is this?

This demo showcases four partial schemas running as federated microservices secured with Keycloak. Each of these schemas can be accessed on their own and form a partial shape of an overall schema. The gateway fetches the service capabilities from the running services to create an overall composed schema which can be queried and the gateway pass the keycloak authentication token to the running services. 

<!-- To see the query plan when running queries against the gateway, click on the `Query Plan` tab in the bottom right hand corner of [GraphQL Playground](http://localhost:4000) -->

To learn more about Apollo Federation, check out the [docs](https://www.apollographql.com/docs/apollo-server/federation/introduction)