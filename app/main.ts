import type { ChatCompletionMessageParam } from "openai/resources";
import { getSkillsPrompt, listSkills } from "./skills";
import { parsePrompt } from "./parsePrompt";
import { agentLoop } from "./agentLoop";

async function main() {
  const [, , flag, prompt] = process.argv;

  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const messages: ChatCompletionMessageParam[] = [];

  const skills = await listSkills();
  const skillsPrompt = getSkillsPrompt(skills);

  if (skillsPrompt) {
    messages.push({ role: "system", content: skillsPrompt });
  }

  messages.push(...parsePrompt(prompt, skills));

  // Agent loop: until desired result is accomplished
  const result = await agentLoop(messages);
  console.log(result);
}

main();
