import OpenAI from "openai";
import type {
  ChatCompletionFunctionTool,
  ChatCompletionMessageParam,
} from "openai/resources";

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

const WriteTool: ChatCompletionFunctionTool = {
  type: "function",
  function: {
    name: "Write",
    description: "Write content to a file",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path of the file to write to",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
      },
      required: ["file_path", "content"],
    },
  },
};

const toolFunctions = {
  [ReadTool.function.name]: async ({ file_path }: { file_path: string }) => {
    const file = Bun.file(file_path);
    return await file.text();
  },
  [WriteTool.function.name]: async ({
    file_path,
    content,
  }: {
    file_path: string;
    content: string;
  }) => {
    console.error("wrinting...", content);
    await Bun.write(file_path, content);
    console.error("written", file_path);
    return content;
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
    try {
      const response = await client.chat.completions.create({
        model: "anthropic/claude-haiku-4.5",
        messages,
        tools: [ReadTool, WriteTool],
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
            console.error("tool", tool_call.function.name, parameters);
            const fileContent = await toolFunctions[tool_call.function.name]?.(parameters);
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
    } catch (error) {
      console.error("Error", error);
    }
  }
}

main();
