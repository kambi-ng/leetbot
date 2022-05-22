import { gql } from "@apollo/client/core";
import { client } from "./client";

export function fetchDaily() {
  client
    .query({
      query: gql`
        query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            link
            question {
              acRate
              difficulty
              freqBar
              frontendQuestionId: questionFrontendId
              isFavor
              paidOnly: isPaidOnly
              status
              title
              titleSlug
              hasVideoSolution
              hasSolution
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
    })
    .then(result => console.log(result.data));
}

export function fetchRandom() {
  client
    .query({
      query: gql`
        query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
          randomQuestion(categorySlug: $categorySlug, filters: $filters) {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            hasVideoSolution
            hasSolution
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
    })
    .then(result => console.log(result));
}
