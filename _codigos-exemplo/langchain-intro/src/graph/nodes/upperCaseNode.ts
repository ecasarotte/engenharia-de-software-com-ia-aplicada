import { StatementSync } from "node:sqlite";
import { type GraphState } from "../graph.ts";
import { AIMessage } from "langchain";
import { startCpuProfile } from "v8";

export function upperCaseNode(state: GraphState): GraphState {
    const responseText = state.output.toUpperCase();

    return {
        ...state,
        output: responseText
    }
}