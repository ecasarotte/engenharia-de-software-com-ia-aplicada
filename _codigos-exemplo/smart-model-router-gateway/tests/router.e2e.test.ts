import test, { todo } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.ts';
import { OpenRouterService, type LLMResponse } from '../src/services/openRouterService.ts';
import { config } from '../src/config.ts';

console.assert(process.env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY environment variable is not set');

test('routes to cheapest model by default', async () => {
    const customConfig = {
        ...config,
        provider: {
            ...config.provider,
            sort: {
                ...config.provider.sort,
                by: 'price'
            }
        }
    }

    const routerService = new OpenRouterService(customConfig);
    const app = createServer(routerService);

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: 'what is rate limit?'
        }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json() as LLMResponse

    assert.equal(body.model, 'inclusionai/ling-3.0-flash:free'); // might change over the time...
});

test('routes to highest throughput model by default', async () => {
    const customConfig = {
        ...config,
        provider: {
            ...config.provider,
            sort: {
                ...config.provider.sort,
                by: 'throughput'
            }
        }
    }

    const routerService = new OpenRouterService(customConfig);
    const app = createServer(routerService);

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: 'what is rate limit?'
        }
    });

    assert.equal(response.statusCode, 200);

    const body = response.json() as LLMResponse

    assert.equal(body.model, 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'); // might change over the time...
});
