import type { Skill } from "./skills";

export const parsePrompt = (content: string, skills: Skill[]) => {
  if (content.startsWith("/")) {
    const [skillName, ...rest] = content
      .slice(1)
      .trim()
      .split(/\s+(.*)/s);

    const skill = skills.find((s) => s.name === skillName);
    if (skill) {
      return skill.body + "\n" + rest[0];
    }
  }

  return content;
};
