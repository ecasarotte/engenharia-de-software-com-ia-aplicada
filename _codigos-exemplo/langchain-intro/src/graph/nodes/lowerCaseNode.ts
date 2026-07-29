import { StatementSync } from "node:sqlite";
import { type GraphState } from "../graph.ts";
import { AIMessage } from "langchain";
import { startCpuProfile } from "v8";

export function lowerCaseNode(state: GraphState): GraphState {
    const responseText = state.output.toLowerCase();

    return {
        ...state,
        output: responseText
    }
}