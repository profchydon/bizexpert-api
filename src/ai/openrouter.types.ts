export type ChatToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: ChatToolCall[];
    }
  | { role: "tool"; content: string; tool_call_id: string };

export type ChatTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

export type OpenRouterChatRequest = {
  model: string;
  messages: ChatMessage[];
  tools: ChatTool[];
  tool_choice: "auto";
  max_tokens: number;
};

export type OpenRouterChatCompletion = {
  choices: Array<{
    finish_reason: string | null;
    message: {
      content: string | null;
      role: string;
      tool_calls?: ChatToolCall[];
    };
  }>;
};

export type OpenRouterConfig = {
  apiKey: string;
  appUrl?: string;
};
