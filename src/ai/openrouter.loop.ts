import { completeOpenRouterChat } from "./openrouter.client";
import type {
  ChatMessage,
  ChatTool,
  OpenRouterConfig,
} from "./openrouter.types";

type LoopInput = {
  config: OpenRouterConfig;
  model: string;
  messages: ChatMessage[];
  tools: ChatTool[];
  execute: (name: string, args: unknown) => Promise<string>;
  maxTurns?: number;
  fetchImpl?: typeof fetch;
};

export async function runOpenRouterToolLoop(input: LoopInput): Promise<string> {
  const messages = [...input.messages];
  const maxTurns = input.maxTurns ?? 5;
  let finalResponse = "";

  for (let i = 0; i < maxTurns; i++) {
    const completion = await completeOpenRouterChat(
      input.config,
      {
        model: input.model,
        messages,
        tools: input.tools,
        tool_choice: "auto",
        max_tokens: 1024,
      },
      input.fetchImpl,
    );
    const choice = completion.choices[0];
    const toolCalls = choice?.message.tool_calls;
    if (!choice || choice.finish_reason === "stop" || !toolCalls?.length) {
      finalResponse = choice?.message.content ?? "Done.";
      break;
    }
    messages.push({
      role: "assistant",
      content: choice.message.content,
      tool_calls: toolCalls,
    });
    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await input.execute(toolCall.function.name, args);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  return finalResponse || "Sorry, I could not process your request.";
}
