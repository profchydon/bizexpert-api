import { runOpenRouterToolLoop } from "./openrouter.loop";
import type { ChatTool } from "./openrouter.types";

const tools: ChatTool[] = [
  {
    type: "function",
    function: {
      name: "get_sales_summary",
      parameters: { type: "object", properties: {} },
    },
  },
];

function jsonFetch(bodies: unknown[]) {
  let i = 0;
  return jest.fn(async (_url: string, _init?: RequestInit) => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(bodies[i++]),
  }));
}

describe("runOpenRouterToolLoop", () => {
  const config = { apiKey: "sk-or-test" };

  it("returns assistant content when the model stops", async () => {
    const fetchImpl = jsonFetch([
      {
        choices: [
          {
            finish_reason: "stop",
            message: { role: "assistant", content: "Revenue is ₦10" },
          },
        ],
      },
    ]);
    const text = await runOpenRouterToolLoop({
      config,
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: "sales?" }],
      tools,
      execute: async () => "",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(text).toBe("Revenue is ₦10");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("runs tool calls then returns the follow-up answer", async () => {
    const fetchImpl = jsonFetch([
      {
        choices: [
          {
            finish_reason: "tool_calls",
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "get_sales_summary",
                    arguments: '{"period":"today"}',
                  },
                },
              ],
            },
          },
        ],
      },
      {
        choices: [
          {
            finish_reason: "stop",
            message: { role: "assistant", content: "Today: ₦5" },
          },
        ],
      },
    ]);
    const execute = jest.fn(async (name: string, args: unknown) => {
      expect(name).toBe("get_sales_summary");
      expect(args).toEqual({ period: "today" });
      return '{"totalRevenue":5}';
    });
    const text = await runOpenRouterToolLoop({
      config,
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: "sales?" }],
      tools,
      execute,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(text).toBe("Today: ₦5");
    expect(execute).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(
      (fetchImpl.mock.calls[1][1] as RequestInit).body as string,
    );
    expect(secondBody.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          tool_calls: expect.any(Array),
        }),
        expect.objectContaining({
          role: "tool",
          tool_call_id: "call_1",
          content: '{"totalRevenue":5}',
        }),
      ]),
    );
  });
});
