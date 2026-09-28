import OpenAI from "openai";
import type { ChatCompletionFunctionTool, ChatCompletionMessageParam } from "openai/resources";

const ReadTool: ChatCompletionFunctionTool = {
  type: "function",
  function: {
    name: "Read",
    description: "Read and return the contents of a file",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to read",
        },
      },
      required: ["file_path"],
    },
  },
};

const toolFunctions = {
  [ReadTool.function.name]: async (filePath: string) => {
    const file = Bun.file(filePath);
    return await file.text();
  },
};

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

  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: prompt },
  ];

  while (true) {
    console.error(messages);
    const response = await client.chat.completions.create({
      model: "anthropic/claude-haiku-4.5",
      messages,
      tools: [ReadTool],
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }

    // You can use print statements as follows for debugging, they'll be visible when running tests.
    console.error("Logs from your program will appear here!");

    const message = response.choices[0]?.message;
    messages.push({
      role: "assistant",
      content: message.content ?? null,
      ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}),
    });

    if (message?.tool_calls && message.tool_calls.length > 0) {
      message.tool_calls.forEach(async (tool_call) => {
        if (tool_call.type === "function" && tool_call.function.name === ReadTool.function.name) {
          const parameters = JSON.parse(tool_call.function.arguments);
          const fileContent = await toolFunctions[ReadTool.function.name](parameters.file_path);
          // console.log(fileContent);
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
  }
}

main();
