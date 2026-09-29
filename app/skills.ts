import { readdir, exists } from "node:fs/promises";
import path from "path";
import { getString, parseFrontmatter } from "./frontmatter";

export type Skill = {
  name: string;
  description: string;
  body: string;
  path: string;
};

export const listSkills = async (root = ".claude/skills") => {
  if (!(await exists(root))) {
    return [];
  }

  const skills: Skill[] = [];

  // Each skill should have a directory consisting a SKILL.md file
  const skillDirectories = await readdir(root, { withFileTypes: true });

  for (const skillDirectory of skillDirectories) {
    if (!skillDirectory.isDirectory()) {
      continue;
    }

    const skillPath = path.join(root, skillDirectory.name, "SKILL.md");
    const skillFile = Bun.file(skillPath);
    if (!(await skillFile.exists())) {
      continue;
    }

    const content = await skillFile.text();
    const parsedSkill = parseFrontmatter(content);

    if (!parsedSkill.ok) {
      console.error(parsedSkill.error);
      return [];
    }

    const { frontmatter, body } = parsedSkill;
    const name = getString(frontmatter, "name") ?? skillDirectory.name;
    const description = getString(frontmatter, "description") ?? "";

    skills.push({
      name,
      description,
      body,
      path: skillPath,
    });
  }

  return skills;
};

export const getSkillsPrompt = (skills: Skill[]) => {
  if (skills.length === 0) {
    return null;
  }

  const skillsStrings = skills.map((skill) => `- ${skill.name}: ${skill.description}`);
  return `You have access to following skills:\n\n${skillsStrings.join('\n')}\n\nIf a skill matches the user's request, call the Skill tool with its name and follow the instructions it returns.`;
};

