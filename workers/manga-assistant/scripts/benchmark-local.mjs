// Alternate LOCAL entry point. Never referenced by production wrangler.jsonc.
import worker from '../src/index.ts';
import { modelStrategy } from '../src/model-strategies.ts';
import { extractAssistantContent } from '../src/validation.ts';

let calls = 0;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || env.LOCAL_MODEL_BENCHMARK !== '1' || request.headers.has('Origin')) return new Response(null, { status: 404 });
    const strategy = modelStrategy(env.MANGA_AI_MODEL);
    // Experimental GLM cannot accidentally spend inference quota in benchmark V1.
    if (!strategy?.v1Benchmark || calls >= 6 || request.method !== 'POST' || url.pathname !== '/assist') return new Response(null, { status: 403 });
    let body;
    try { body = await request.clone().json(); } catch { return new Response(null, { status: 400 }); }
    const mode = env.LOCAL_BENCHMARK_MODE ?? 'translate';
    if (!['translate', 'study', 'mixed'].includes(mode)
      || !['translate', 'study'].includes(body.mode)
      || (mode !== 'mixed' && body.mode !== mode)) return new Response(null, { status: 400 });
    let usage, assistantContent;
    const response = await worker.fetch(request, { ...env, AI: {
      async run(model, input) {
        if (calls >= 6) throw new Error('benchmark-limit');
        calls++;
        const output = await env.AI.run(model, input);
        // Opt-in LOCAL diagnostics: only assistant content, never the binding envelope.
        if (env.LOCAL_BENCHMARK_RAW === '1') {
          try {
            const content = extractAssistantContent(output);
            const text = typeof content === 'string' ? content : JSON.stringify(content);
            assistantContent = new TextEncoder().encode(text).byteLength <= 90_000 ? text : '[content exceeds diagnostic limit]';
          } catch { assistantContent = '[assistant content unavailable]'; }
        }
        if (output?.usage && typeof output.usage === 'object') {
          usage = Object.fromEntries(['prompt_tokens', 'completion_tokens', 'total_tokens', 'neurons']
            .filter(key => typeof output.usage[key] === 'number' && Number.isFinite(output.usage[key]))
            .map(key => [key, output.usage[key]]));
        }
        return output;
      },
    } });
    if (response.status === 502 && env.LOCAL_BENCHMARK_RAW === '1') {
      console.log('LOCAL_INVALID_ASSISTANT_CONTENT', JSON.stringify(assistantContent));
    }
    const headers = new Headers(response.headers);
    if (usage) headers.set('X-Manga-Benchmark-Usage', JSON.stringify(usage));
    return new Response(response.body, { status: response.status, headers });
  },
};
