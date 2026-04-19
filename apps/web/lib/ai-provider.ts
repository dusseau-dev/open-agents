/**
 * OpenRouter adapter — gateway-compatible.
 *
 * Upstream open-agents uses `gateway` from the `ai` package (Vercel AI Gateway).
 * This fork swaps to OpenRouter for broader model access. To minimize upstream
 * divergence, this module exposes the same call signature and
 * `getAvailableModels()` shape, so usage sites only need to change the import.
 *
 * If upstream modifies model handling, update this adapter rather than
 * scattering OpenRouter details across call sites.
 */
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[ai-provider] OPENROUTER_API_KEY is not set — model calls will fail.",
  );
}

const openrouter = createOpenRouter({
  apiKey: apiKey ?? "",
  // Vercel attribution headers per OpenRouter best practices.
  headers: {
    "HTTP-Referer":
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://open-agents-mocha.vercel.app",
    "X-Title": "Open Agents",
  },
});

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

interface GatewayCompatibleModel {
  id: string;
  name: string;
  description?: string;
  modelType?: string;
  context_length?: number;
  pricing?: OpenRouterModel["pricing"];
}

async function getAvailableModels(): Promise<{
  models: GatewayCompatibleModel[];
}> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenRouter models: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as OpenRouterModelsResponse;
  const models = payload.data.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    modelType: "language",
    context_length: m.context_length,
    pricing: m.pricing,
  }));

  return { models };
}

/**
 * Drop-in replacement for `gateway` from the `ai` package.
 * Call with a model id: aiProvider("anthropic/claude-3.5-sonnet")
 */
export const aiProvider = Object.assign(openrouter, {
  getAvailableModels,
});
