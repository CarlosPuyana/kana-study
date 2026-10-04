export const LLAMA_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const GEMMA_MODEL = '@cf/google/gemma-4-26b-a4b-it';
export interface ModelStrategy {
  structuredOutput: 'json-schema' | 'plain-json';
  thinking: 'not-applicable' | 'disabled' | 'default';
  tokenParameter: 'max_tokens' | 'max_completion_tokens';
  v1Benchmark: boolean;
}
export const MODEL_STRATEGIES: Readonly<Record<string, ModelStrategy>> = Object.freeze({
  [LLAMA_MODEL]: { structuredOutput: 'json-schema', thinking: 'not-applicable', tokenParameter: 'max_tokens', v1Benchmark: true },
  [GEMMA_MODEL]: { structuredOutput: 'plain-json', thinking: 'disabled', tokenParameter: 'max_completion_tokens', v1Benchmark: true },
  '@cf/zai-org/glm-4.7-flash': { structuredOutput: 'plain-json', thinking: 'default', tokenParameter: 'max_completion_tokens', v1Benchmark: false },
});
export function modelStrategy(model: string): ModelStrategy | undefined {
  return Object.hasOwn(MODEL_STRATEGIES, model) ? MODEL_STRATEGIES[model] : undefined;
}
