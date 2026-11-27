import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  OPENROUTER_APP_TITLE,
  OPENROUTER_BASE_URL,
  OPENROUTER_DEFAULT_MODEL,
  completeOpenRouterChat,
  openRouterHeaders,
  resolveOpenRouterConfig,
} from "./openrouter.client";

function source(name: string) {
  return readFileSync(join(__dirname, name), "utf8");
}

describe("OpenRouter client", () => {
  it("returns null when the api key is missing or blank", () => {
    expect(resolveOpenRouterConfig(undefined)).toBeNull();
    expect(resolveOpenRouterConfig("")).toBeNull();
    expect(resolveOpenRouterConfig("   ")).toBeNull();
  });

  it("builds OpenRouter auth and attribution headers", () => {
    const config = resolveOpenRouterConfig(
      "sk-or-test",
      "https://bizexpert.app",
    );
    expect(config).toEqual({
      apiKey: "sk-or-test",
      appUrl: "https://bizexpert.app",
    });
    expect(openRouterHeaders(config!)).toEqual({
      Authorization: "Bearer sk-or-test",
      "Content-Type": "application/json",
      "X-OpenRouter-Title": OPENROUTER_APP_TITLE,
      "HTTP-Referer": "https://bizexpert.app",
    });
    expect(OPENROUTER_BASE_URL).toBe("https://openrouter.ai/api/v1");
    expect(OPENROUTER_DEFAULT_MODEL).toBe("openai/gpt-4o");
  });

  it("posts chat completions to OpenRouter and throws on HTTP errors", async () => {
    const config = resolveOpenRouterConfig("sk-or-test")!;
    const fetchOk = jest.fn(async (url: string, init?: RequestInit) => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { role: "assistant", content: "Hi" },
            },
          ],
        }),
      url,
      init,
    }));
    const result = await completeOpenRouterChat(
      config,
      {
        model: OPENROUTER_DEFAULT_MODEL,
        messages: [{ role: "user", content: "Hi" }],
        tools: [],
        tool_choice: "auto",
        max_tokens: 1024,
      },
      fetchOk as unknown as typeof fetch,
    );
    expect(fetchOk.mock.calls[0][0]).toBe(
      "https://openrouter.ai/api/v1/chat/completions",
    );
    expect(result.choices[0].message.content).toBe("Hi");

    const fetchFail = jest.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => "unauthorized",
    }));
    await expect(
      completeOpenRouterChat(
        config,
        {
          model: OPENROUTER_DEFAULT_MODEL,
          messages: [{ role: "user", content: "Hi" }],
          tools: [],
          tool_choice: "auto",
          max_tokens: 1024,
        },
        fetchFail as unknown as typeof fetch,
      ),
    ).rejects.toThrow("OpenRouter 401");
  });

  it("does not import or depend on the openai package", () => {
    const pkg = source("../../package.json");
    expect(pkg).not.toMatch(/"openai"\s*:/);
    expect(source("ai.service.ts")).not.toContain('from "openai"');
    expect(source("ai-tools.ts")).not.toContain('from "openai"');
    expect(source("openrouter.client.ts")).not.toContain('from "openai"');
    expect(source("ai.service.ts")).toContain("resolveOpenRouterConfig");
    expect(source("ai.service.ts")).toContain("runOpenRouterToolLoop");
  });
});
