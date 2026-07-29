import {
    END,
    MessagesZodMeta,
    START,
    StateGraph,

} from '@langchain/langgraph';
import { withLangGraph } from '@langchain/langgraph/zod';
import { BaseMessage } from 'langchain';
import { z } from 'zod/v3'; // import made in that specific version to solve an issue with the Chat at Langchain v1.2.17
import { identifiyIntent } from './nodes/identifyIntentNode.ts';
import { chatResponseNode } from './nodes/chatResponseNode.ts';
import { upperCaseNode } from './nodes/upperCaseNode.ts';
import { lowerCaseNode } from './nodes/lowerCaseNode.ts';
import { fallbackNode } from './nodes/fallbackNode.ts';

const GraphState = z.object({
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
    output: z.string(),
    command: z.enum(['uppercase', 'lowercase', 'unknown'])
});

export type GraphState = z.infer<typeof GraphState>;

export function buildGraph() {
    const workflow = new StateGraph({
        stateSchema: GraphState
    })
        .addNode("IdentifyIntent", identifiyIntent)
        .addNode("ChatResponse", chatResponseNode)
        .addNode("Uppercase", upperCaseNode)
        .addNode("Lowercase", lowerCaseNode)
        .addNode("Fallback", fallbackNode)
        // .addNode("IdentifyIntent", (state: GraphState) => {
        //     return {
        //         ...state,
        //         output: 'test',
        //     }
        // })
        .addEdge(START, "IdentifyIntent")
        .addConditionalEdges("IdentifyIntent",
            (state: GraphState) => {
                switch (state.command) {
                    case 'uppercase':
                        return 'uppercase';
                    case 'lowercase':
                        return 'lowercase';
                    default:
                        return 'fallback'
                }
            },
            {
                'uppercase': 'Uppercase',
                'lowercase': 'Lowercase',
                'fallback': 'Fallback',
            }

        )
        .addEdge("Uppercase", "ChatResponse")
        .addEdge("Lowercase", "ChatResponse")
        .addEdge("Fallback", "ChatResponse")
        .addEdge("ChatResponse", END)


    return workflow.compile();
}