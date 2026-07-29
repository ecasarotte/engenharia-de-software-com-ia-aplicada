import { StatementSync } from "node:sqlite";
import { type GraphState } from "../graph.ts";
import { AIMessage } from "langchain";
import { startCpuProfile } from "v8";

export function chatResponseNode(state: GraphState): GraphState {
    const responseText = state.output;
    const aiMessage = new AIMessage(responseText);

    return {
        ...state,
        messages: [
            ...state.messages,
            aiMessage
        ]
    }
}