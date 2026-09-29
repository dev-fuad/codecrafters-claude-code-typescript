import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import { toolFunctions, tools } from "./tools";

export const agentLoop = async (messages: ChatCompletionMessageParam[]) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

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
              content: fileContent ?? "",
            });
          }
        });
      } else {
        return response.choices[0].message.content;
      }
    } catch (error) {
      console.error("Error", error);
    }
  }
};
