import type { Skill } from "./skills";

export const parsePrompt = (content: string, skills: Skill[]) => {
  if (content.startsWith("/")) {
    const [skillName, ...args] = content
      .slice(1)
      .trim()
      .split(/\s+/s);

    const skill = skills.find((s) => s.name === skillName);
    if (skill) {
      return replaceArguments(content, args);
    }
  }

  return content;
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

