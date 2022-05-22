import {
  ApolloClient,
  InMemoryCache,
  gql
} from "@apollo/client";

export const client = new ApolloClient({
  uri: "https://leetcode.com/graphql/",
  cache: new InMemoryCache()
});

// client
//   .query({
//     query: gql`
//       query GetRates {
//         rates(currency: "USD") {
//           currency
//         }
//       }
//     `
//   })
//   .then(result => console.log(result));

