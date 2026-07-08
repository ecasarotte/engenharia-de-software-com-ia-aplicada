import { type Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

type DebugLog = (...args: unknown[]) => void;

type params = {
    debugLog: DebugLog,
    vectorStore: Neo4jVectorStore,
    nlpModel: ChatOpenAI,
    promptConfig: any,
    templateText: string,
    topK: number,
}

// o langChain funciona como se fosse um pipeline, onde cada etapa é um "chain" (ou corrente). 
// Cada corrente recebe uma entrada, processa e passa para a próxima corrente. 
// A corrente final retorna a resposta final. O estado da corrente será mantido em um 
// objeto chamado "ChainState".
interface ChainState {
    question: string;
    context?: string;
    topScore?: number;
    error?: string;
    answer?: string;
}

export class AI {
    private params: params;

    constructor(params: params) {
        this.params = params;
    }

    async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {
        console.log(`\n🔍 Searching for similar documents on NEO4J vector store...\n`);

        const vectorResults = await this.params.vectorStore.similaritySearchWithScore(input.question, this.params.topK);

        if (!vectorResults || vectorResults.length === 0) {
            this.params.debugLog(`❌ No similar documents found in the vector store.`);
            return {
                ...input,
                error: "Desculpe, não encontrei informações relevantes sobre essa pergunta na base de conhecimento.",
            }
        }

        const topScore = vectorResults[0]![1];
        this.params.debugLog(`✅ Found ${vectorResults.length} similar documents. Top score: ${topScore.toFixed(3)}`);

        const contexts = vectorResults.filter(([doc, score]) => score >= 0.5).map(([doc]) => doc.pageContent);

        return {
            ...input,
            context: contexts.join("\n\n---\n\n"),
            topScore,
        }
    }

    async generateAnswer(input: ChainState): Promise<ChainState> {
        if (input.error) return input;

        console.log(`\n🤖 Generating answer using AI...\n`);

        const responsePrompt = ChatPromptTemplate.fromTemplate(this.params.templateText);

        const responseChain = responsePrompt.pipe(this.params.nlpModel).pipe(new StringOutputParser());

        const rawResponse = await responseChain.invoke({
            role: this.params.promptConfig.role,
            task: this.params.promptConfig.task,
            tone: this.params.promptConfig.constraints.tone,
            language: this.params.promptConfig.constraints.language,
            format: this.params.promptConfig.constraints.format,
            instructions: this.params.promptConfig.instructions.map((instruction: string, idx: number) =>
                `${idx + 1}. ${instruction}`
            ).join('\n'),
            question: input.question,
            context: input.context
        });

        return {
            ...input,
            answer: rawResponse,
        }
    }

    async answerQuestion(question: string): Promise<ChainState> {
        const chain = RunnableSequence.from([ // Criação da pipeline (LanchChain)
            this.retrieveVectorSearchResults.bind(this), // NEO4j busca embeddings similares a pergunta
            this.generateAnswer.bind(this), // Pipeline é iniciada, IA recebe a pergunta e o contexto e gera a resposta
        ]);

        const result = await chain.invoke({ question });
        this.params.debugLog("\n🎙️  Question:");
        this.params.debugLog(question, "\n");
        this.params.debugLog("💬 Answer:");
        this.params.debugLog(result.answer || result.error, "\n");

        return result;
    }
}