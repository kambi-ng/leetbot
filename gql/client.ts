import {
  ApolloClient,
  InMemoryCache
} from "@apollo/client/core";
import "cross-fetch/polyfill";

export const client = new ApolloClient({
  uri: "https://leetcode.com/graphql/",
  cache: new InMemoryCache()
});

interface TopicTag {
  [key: string]: string;
}

export interface Question {
  acRate: number,
  difficulty: string,
  frontendQuestionId: number,
  title: string,
  titleSlug: string,
  content: string,
  topicTags: [
    TopicTag
  ]
}
