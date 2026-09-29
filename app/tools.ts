import { $ } from "bun";
import type {
  ChatCompletionFunctionTool,
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

const BashTool: ChatCompletionFunctionTool = {
  type: "function",
  function: {
    name: "Bash",
    description: "Execute a shell command",
    parameters: {
      type: "object",
      required: ["command"],
      properties: {
        command: {
          type: "string",
          description: "The command to execute",
        },
      },
    },
  },
};

export const tools = [ReadTool, WriteTool, BashTool];

export const toolFunctions = {
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
    await Bun.write(file_path, content);
    return content;
  },
  [BashTool.function.name]: async ({ command }: { command: string }) => {
    const { stdout, stderr, exitCode } = await $`bash -c "${command}"`.nothrow().quiet();
    if (exitCode !== 0) {
      return stderr.toString();
    }
    return stdout.toString();
  },
};
