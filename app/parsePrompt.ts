import type { ChatCompletionMessageParam } from "openai/resources";
import type { Skill } from "./skills";

export const parsePrompt = (content: string, skills: Skill[]): ChatCompletionMessageParam[] => {
  if (content.startsWith("/")) {
    const tokens = content
      .trim()
      .split(/\s+/s);

    const skillsUsed: Skill[] = [];
    for (const token of tokens) {
      if (token.startsWith("/")) {
        const skillName = token.slice(1);
        const skill = skills.find((s) => s.name === skillName);
        if (skill) {
          skillsUsed.push(skill);
          continue;
        }
      }
      break;
    }
    const args = tokens.slice(skillsUsed.length);
    if (skillsUsed.length > 0) {
      const messages: ChatCompletionMessageParam[] = skillsUsed.map((skillUsed) => {
        return {
          role: "user",
          content: getContentFromSkill(skillUsed, args),
        };
      });
      return messages;
    }
  }

  return [{ role: "user", content }];
};

export function getContentFromSkill(skill: Skill, args?: string[]) {
  const skillPathString = `Skill: ${skill.name} (located at ${skill.path})\nPaths in the instructions below are relative to that folder.\n\n`;
  if (args?.length) {
    return skillPathString + replaceArguments(skill.body, args);
  }
  return skillPathString + skill.body;
}

export function replaceArguments(body: string, args: string[]): string {
  const regex = /\$ARGUMENTS(?:\[\d+\])?|\$\d+/g;

  return body.replace(regex, (match) => {
    if (match === "$ARGUMENTS") {
      return args.join(" ");
    }

    if (match.startsWith("$ARGUMENTS[")) {
      const index = Number(match.match(/\d+/)?.[0]);

      return args[index] ?? "";
    }

    if (match.startsWith("$")) {
      const index = Number(match.slice(1));

      return args[index] ?? "";
    }

    return match;
  });
}

