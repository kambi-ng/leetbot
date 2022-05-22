import {
  ApolloClient,
  InMemoryCache
} from "@apollo/client/core";
import "cross-fetch/polyfill";

export const client = new ApolloClient({
  uri: "https://leetcode.com/graphql/",
  cache: new InMemoryCache()
});
