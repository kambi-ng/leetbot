import { Question } from "../gql/client";

export function embedFactory(context: string, {
  acRate, difficulty, frontendQuestionId, title, titleSlug, content, topicTags
}: Question) {

  const topics = topicTags.map(tag => tag.name).join(", ");

  return {
    color: resolveColor(difficulty),
    author: { name: context },
    title: `${frontendQuestionId}. ${title}}}`,
    url: `https://leetcode.com/problems/${titleSlug}/`,
    description: `AC Rate: ${acRate}; Tags: ${topics}`,
    thumbnail: {
      url: "https://leetcode.com/static/images/LeetCode_logo_rvs.png",
    },
    fields: [
      {
        name: "Question Prompt",
        value: content,
      }
    ]
  };
}

function resolveColor(difficulty: string): string {
  switch (difficulty) {
    case "Medium":
      return "#ffc528";
    case "Hard":
      return "#f02723";
    default:
      return "#40b46f";
  }
}

export default embedFactory;
