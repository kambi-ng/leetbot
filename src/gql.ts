import { gql } from "@apollo/client/core";
import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import "cross-fetch/polyfill";

export const client = new ApolloClient({
  uri: "https://leetcode.com/graphql/",
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "no-cache",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
  },
  cache: new InMemoryCache(),
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
  acRate: number;
  difficulty: "Easy" | "Medium" | "Hard";
  questionId: number;
  title: string;
  likes: number;
  dislikes: number;
  titleSlug: string;
  content: string;
  topicTags: [TopicTag];
}

export interface QuestionOfToday {
  activeDailyCodingChallengeQuestion: ActiveDailyCodingChallengeQuestion;
}

export function fetchDaily() {
  return client.query<QuestionOfToday>({
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
    `,
  });
}

export const questionTags = [
  "array",
  "string",
  "hash-table",
  "dynamic-programming",
  "math",
  "sorting",
  "depth-first-search",
  "greedy",
  "database",
  "breadth-first-search",
  "tree",
  "binary-search",
  "matrix",
  "binary-tree",
  "two-pointers",
  "bit-manipulation",
  "stack",
  "heap-priority-queue",
  "design",
  "graph",
  "simulation",
  "prefix-sum",
  "backtracking",
  "counting",
  "sliding-window",
  "linked-list",
  "union-find",
  "monotonic-stack",
  "ordered-set",
  "recursion",
  "trie",
  "binary-search-tree",
  "divide-and-conquer",
  "enumeration",
  "bitmask",
  "queue",
  "memoization",
  "geometry",
  "topological-sort",
  "segment-tree",
  "game-theory",
  "hash-function",
  "binary-indexed-tree",
  "interactive",
  "string-matching",
  "rolling-hash",
  "shortest-path",
  "number-theory",
  "data-stream",
  "combinatorics",
  "randomized",
  "monotonic-queue",
  "iterator",
  "merge-sort",
  "concurrency",
  "doubly-linked-list",
  "brainteaser",
  "probability-and-statistics",
  "quickselect",
  "bucket-sort",
  "suffix-array",
  "minimum-spanning-tree",
  "counting-sort",
  "shell",
  "line-sweep",
  "reservoir-sampling",
  "eulerian-circuit",
  "radix-sort",
  "strongly-connected-component",
  "rejection-sampling",
  "biconnected-component",
];

export const listIdMap = {
  "LeetCode Curated Algo 170": "552y65ke",
  "LeetCode Curated SQL 70": "5htp6xyg",
  "Top 100 Liked Questions": "79h8rn6",
  "Top Interview Questions": "wpwgkgt",
};

export type QuestionFilter = {
  difficulty?: string;
  tags?: string[];
  listId?: string;
};

export type Filter = {
  categorySlug: string;
  filters: QuestionFilter;
};

interface RandomQuestion {
  randomQuestion: Question;
}

export function fetchRandom(filters: QuestionFilter) {
  return client.query<RandomQuestion>({
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
      categorySlug: "",
      filters,
    },
  });
}

interface QuestionDetail {
  question: Question;
}

export function fetchQuestion(titleSlug: string) {
  return client.query<QuestionDetail>({
    query: gql`
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
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
      titleSlug,
    },
  });
}

interface SearchQuestion {
  problemsetQuestionList: {
    total: number;
    questions: Question[];
  };
}

export function searchQuestion(searchKeywords: string, filters: QuestionFilter, page: number = 0) {
  return client.query<SearchQuestion>({
    query: gql`
      query problemsetQuestionList(
        $categorySlug: String
        $limit: Int
        $skip: Int
        $filters: QuestionListFilterInput
      ) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
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
    `,
    variables: {
      categorySlug: "",
      skip: 10 * page,
      limit: 10,
      filters: {
        searchKeywords,
        ...filters,
      },
    },
  });
}
