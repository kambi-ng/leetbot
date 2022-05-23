import { gql } from "@apollo/client/core";
import { client } from "./client";

export function fetchDaily() {
  return client
    .query({
      query: gql`
        query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            link
            question {
              acRate
              difficulty
              frontendQuestionId
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
            frontendQuestionId
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
