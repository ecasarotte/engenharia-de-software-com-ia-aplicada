import { StatementSync } from "node:sqlite";
import { type GraphState } from "../graph.ts";
import { AIMessage } from "langchain";
import { startCpuProfile } from "v8";

export function fallbackNode(state: GraphState): GraphState {
    const msg = "Sorry, this command is actually unknown, try 'make this uppercase' or 'make this lowercase'";
    const fallbackMessage = new AIMessage(msg).content.toString();

    return {
        ...state,
        output: msg,
        messages: [
            ...state.messages
        ]
    }
}