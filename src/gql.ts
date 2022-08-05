import { gql } from "@apollo/client/core";
import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import 'cross-fetch/polyfill';

export const client = new ApolloClient({
  uri: "https://leetcode.com/graphql/",
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    }
  },
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

export const questionTags = ['array', 'string', 'hash-table', 'dynamic-programming', 'math', 'sorting', 'depth-first-search', 'greedy', 'database', 'breadth-first-search', 'tree', 'binary-search', 'matrix', 'binary-tree', 'two-pointers', 'bit-manipulation', 'stack', 'heap-priority-queue', 'design', 'graph', 'simulation', 'prefix-sum', 'backtracking', 'counting', 'sliding-window', 'linked-list', 'union-find', 'monotonic-stack', 'ordered-set', 'recursion', 'trie', 'binary-search-tree', 'divide-and-conquer', 'enumeration', 'bitmask', 'queue', 'memoization', 'geometry', 'topological-sort', 'segment-tree', 'game-theory', 'hash-function', 'binary-indexed-tree', 'interactive', 'string-matching', 'rolling-hash', 'shortest-path', 'number-theory', 'data-stream', 'combinatorics', 'randomized', 'monotonic-queue', 'iterator', 'merge-sort', 'concurrency', 'doubly-linked-list', 'brainteaser', 'probability-and-statistics', 'quickselect', 'bucket-sort', 'suffix-array', 'minimum-spanning-tree', 'counting-sort', 'shell', 'line-sweep', 'reservoir-sampling', 'eulerian-circuit', 'radix-sort', 'strongly-connected-component', 'rejection-sampling', 'biconnected-component'] as const

export type QuestionTags = typeof questionTags

export const listIdMap = {
  "LeetCode Curated Algo 170": "552y65ke",
  "LeetCode Curated SQL 70": "5htp6xyg",
  "Top 100 Liked Questions": "79h8rn6",
  "Top Interview Questions": "wpwgkgt"
} as const

export type ListName = keyof typeof listIdMap;
export type ListId = typeof listIdMap[ListName];

export type QuestionFilter = {
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  tags?: string[]
  listId?: string
}
export type Filter = {
  categorySlug: string
  filters: QuestionFilter
}

export interface RandomQuestion {
  randomQuestion: Question
}

export function fetchRandom({ categorySlug, filters }: Filter) {
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
      variables: {
        categorySlug,
        filters,
      }
    });
}
