import { gql } from "@apollo/client/core";
import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import 'cross-fetch/polyfill';

export const client = new ApolloClient({
  uri: "https://leetcode.com/graphql/",
  cache: new InMemoryCache()
});

export interface TopicTag {
  [key: string]: string;
}


export interface ActiveDailyCodingChallengeQuestion {
  date: string;
  link: string;
  question: Question;
}

export interface Question {
  acRate: number,
  difficulty: "Easy" | "Medium" | "Hard",
  questionId: number,
  title: string,
  likes: number,
  dislikes: number,
  titleSlug: string,
  content: string,
  topicTags: [
    TopicTag
  ]
}

export interface QuestionOfToday {
  activeDailyCodingChallengeQuestion: ActiveDailyCodingChallengeQuestion
}

export function fetchDaily() {
  return client
    .query<QuestionOfToday>({
      query: gql`
        query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            link
            question {
              acRate
              difficulty
              questionId
              title
              likes
              dislikes
              titleSlug
              content
              topicTags {
                name
                id
                slug
              }
            }
          }
        }
      `
    });
}

interface RandomQuestionProps {
  categorySlug: string
  filters: {
    difficulty: "EASY" | "MEDIUM" | "HARD"
    [key: string]: string
  }
}

interface RandomQuestion {
  randomQuestion: Question
}

export function fetchRandom(variables: RandomQuestionProps) {
  return client
    .query<RandomQuestion>({
      query: gql`
        query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
          randomQuestion(categorySlug: $categorySlug, filters: $filters) {
            acRate
            difficulty
            questionId
            title
            likes
            dislikes
            titleSlug
            content
            topicTags {
              name
              id
              slug
            }
          }
        }
      `,
      variables
    });
}
