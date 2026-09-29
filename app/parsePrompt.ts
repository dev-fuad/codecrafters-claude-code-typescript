import type { ChatCompletionMessageParam } from "openai/resources";
import type { Skill } from "./skills";

export const parsePrompt = (content: string, skills: Skill[]): ChatCompletionMessageParam[] => {
  console.error('>>>', content, skills);
  if (content.startsWith("/")) {
    const tokens = content
      .trim()
      .split(/\s+/s);

    console.error('>>> ts', tokens);
    const skillsUsed: Skill[] = [];
    for (const token of tokens) {
      console.error('>>> t', token);
      if (token.startsWith("/")) {
        const skillName = token.slice(1);
        console.error('>>> sN', skillName);
        const skill = skills.find((s) => s.name === skillName);
        console.error(skill);
        if (skill) {
          skillsUsed.push(skill);
          continue;
        }
      }
      break;
    }
    console.error('>>>', skillsUsed);
    const args = tokens.slice(skillsUsed.length);
    if (skillsUsed.length > 0) {
      const messages: ChatCompletionMessageParam[] = skillsUsed.map((skillUsed) => ({
        role: "user",
        content: replaceArguments(skillUsed.body, args),
      }));
      console.error('>>>', messages);
      return messages;
    }
  }

  console.error('>>>', content);
  return [{ role: "user", content }];
};

function replaceArguments(body: string, args: string[]): string {
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

