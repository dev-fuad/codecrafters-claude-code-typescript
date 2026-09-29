import { $ } from "bun";
import type { ChatCompletionFunctionTool } from "openai/resources";
import { getContentFromSkill } from "./parsePrompt";
import { listSkills } from "./skills";
import { agentLoop } from "./agentLoop";

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

const SkillTool: ChatCompletionFunctionTool = {
  type: "function",
  function: {
    name: "Skill",
    description: "Load a skill's instructions into the conversation",
    parameters: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "The name of the skill to use" },
        args: {
          type: "string",
          description: "Optional arguments for the skill",
        },
      },
    },
  },
};

export const tools = [ReadTool, WriteTool, BashTool, SkillTool];

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
    const { stdout, stderr, exitCode } = await $`bash -c "${command}"`
      .nothrow()
      .quiet();
    if (exitCode !== 0) {
      return stderr.toString();
    }
    return stdout.toString();
  },
  [SkillTool.function.name]: async ({ name, args }: { name: string, args?: string }) => {
    const tokens = args?.trim().split(/\s+/s);
    const skills = await listSkills();
    const skill = skills.find((s) => s.name === name);
    if (!skill) {
      return "${name}: Skill not found"
    }
    const content = getContentFromSkill(skill, tokens);
    if (skill.context === "fork") {
      return await agentLoop([{ role: "user", content }]);
    }
    return content;
  }
};
