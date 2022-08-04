import { gql } from "@apollo/client/core";
import { client, type QuestionOfToday } from "./client";


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

export function fetchRandom() {
  return client
    .query({
      query: gql`
        query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
          randomQuestion(categorySlug: $categorySlug, filters: $filters) {
            acRate
            difficulty
            questionId
            title
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
      variables: {
        "categorySlug": "",
        "filters": {}
      }
    });
}
