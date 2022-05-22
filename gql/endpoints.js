import { gql } from "@apollo/client";
import { client } from "./client";

export function fetchDaily() {
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
  client
    .query({
      query: gql`
        query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            userStatus
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
    .then(result => console.log(result));
}
