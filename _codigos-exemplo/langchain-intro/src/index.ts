import { createServer } from "./server.ts";

const app = createServer();

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
