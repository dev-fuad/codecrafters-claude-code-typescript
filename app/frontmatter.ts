import { YAML } from "bun";

export const parseFrontmatter = <T extends Record<string, unknown>>(content: string): { ok: true, frontmatter: T, body: string } | { ok: false, error: unknown } => {
  try {
    const normalised = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (!normalised.startsWith("---")) {
      return { ok: true, frontmatter: {} as T, body: normalised };
    }
    const endIndex = normalised.indexOf("\n---", 3);
    if (endIndex === -1) {
      return { ok: true, frontmatter: {} as T, body: normalised };
    }

    const frontmatterString = normalised.slice(4, endIndex);
    const body = normalised.slice(endIndex + 4);

    return { ok: true, frontmatter: YAML.parse(frontmatterString) as T, body };
  } catch (error) {
    return { ok: false, error };
  }
};

export const getString = <T extends Record<string, unknown>>(record: T, key: string) => {
  return typeof record[key] === "string" ? record[key] : undefined;
};

export const getContext = <T extends Record<string, unknown>>(record: T, key: string) => {
  return typeof record[key] === "string" && record[key] === "fork" ? record[key] : undefined;
};

