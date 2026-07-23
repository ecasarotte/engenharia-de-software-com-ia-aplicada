console.assert(process.env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY environment variable is not set');

export type ModelConfig = {
    apiKey: string;
    httpReferer: string;
    xTitle: string;
    port: number;
    models: string[];
    temperature: number;
    maxTokens: number;
    systemPrompt: string;

    provider: {
        sort: {
            by: string;
            partition: string;
        }
    }
}

export const config: ModelConfig = {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    httpReferer: 'http://pos-ai.com',
    xTitle: 'SmartModelRouterGateway',
    port: 3000,
    temperature: 0.2,
    models: [
        'inclusionai/ling-3.0-flash:free', // cheapest
        'openai/gpt-oss-20b:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' // highest throughput
    ],
    maxTokens: 200,
    systemPrompt: 'You are a helpful assistant.',
    provider: {
        sort: {
            // by: 'price'
            by: 'latency',
            // by: 'throughput',
            partition: 'none'
        }
    }
}