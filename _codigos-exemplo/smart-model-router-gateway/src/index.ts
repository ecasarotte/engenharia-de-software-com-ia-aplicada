import { config } from "./config.ts";
import { createServer } from "./server.ts";
import { OpenRouterService } from "./services/openRouterService.ts";

const routerService = new OpenRouterService(config);
const app = createServer(routerService);

app.listen({ port: 3000, host: '0.0.0.0.'});

console.log('Server running on the port 3000');

// const response = await app.inject({
//     method: 'POST',
//     url: '/chat',
//     body: {
//         question: 'what is rate limit?'
//     }
// });

// console.log('Response status code:', response.statusCode);
// console.log('Response body:', response.body);
