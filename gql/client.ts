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

export interface QuestionOfToday {
  activeDailyCodingChallengeQuestion: ActiveDailyCodingChallengeQuestion
}

export interface ActiveDailyCodingChallengeQuestion {
  date: string;
  link: string;
  question: Question;
}

export interface Question {
  acRate: number,
  difficulty: string,
  questionId: number,
  title: string,
  titleSlug: string,
  content: string,
  topicTags: [
    TopicTag
  ]
}
