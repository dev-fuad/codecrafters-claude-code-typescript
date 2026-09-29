import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import { toolFunctions, tools } from "./tools";
import { getSkillsPrompt, listSkills } from "./skills";
import { parsePrompt } from "./parsePrompt";

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const messages: ChatCompletionMessageParam[] = [];

  const skills = await listSkills();
  const skillsPrompt = getSkillsPrompt(skills);

  if (skillsPrompt) {
    messages.push({ role: "system", content: skillsPrompt });
  }

  messages.push({ role: "user", content: parsePrompt(prompt, skills) });

  // Agent loop: until desired result is accomplished
  while (true) {
    try {
      const response = await client.chat.completions.create({
        model: "anthropic/claude-haiku-4.5",
        messages,
        tools,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("no choices in response");
      }

      // You can use print statements as follows for debugging, they'll be visible when running tests.
      console.error("Logs from your program will appear here!");

      const message = response.choices[0]?.message;
      messages.push(message);

      if (message?.tool_calls && message.tool_calls.length > 0) {
        message.tool_calls.forEach(async (tool_call) => {
          if (tool_call.type === "function") {
            const parameters = JSON.parse(tool_call.function.arguments);
            const fileContent =
              await toolFunctions[tool_call.function.name]?.(parameters);
            messages.push({
              role: "tool",
              tool_call_id: tool_call.id,
              content: fileContent,
            });
          }
        });
      } else {
        console.log(response.choices[0].message.content);
        break;
      }
    } catch (error) {
      console.error("Error", error);
    }
  }
}

main();
