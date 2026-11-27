import type {
  OpenRouterChatCompletion,
  OpenRouterChatRequest,
  OpenRouterConfig,
} from "./openrouter.types";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_DEFAULT_MODEL = "openai/gpt-4o";
export const OPENROUTER_APP_TITLE = "BizExpert";

export function resolveOpenRouterConfig(
  apiKey: string | undefined,
  appUrl?: string,
): OpenRouterConfig | null {
  const key = apiKey?.trim();
  if (!key) {
    return null;
  }
  const referer = appUrl?.trim();
  return { apiKey: key, appUrl: referer || undefined };
}

export function openRouterHeaders(
  config: OpenRouterConfig,
): Record<string, string> {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "X-OpenRouter-Title": OPENROUTER_APP_TITLE,
    ...(config.appUrl ? { "HTTP-Referer": config.appUrl } : {}),
  };
}

export async function completeOpenRouterChat(
  config: OpenRouterConfig,
  body: OpenRouterChatRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<OpenRouterChatCompletion> {
  const response = await fetchImpl(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: openRouterHeaders(config),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text) as OpenRouterChatCompletion;
}
