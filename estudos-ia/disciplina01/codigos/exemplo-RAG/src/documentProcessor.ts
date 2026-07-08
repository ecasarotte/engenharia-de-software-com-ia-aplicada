import { PDFLoader} from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { type TextSplitterConfig } from "./config.ts";

export class DocumentProcessor {

    private pdfPath: string;
    private textSplitterConfig: TextSplitterConfig;

    public constructor(pdfPath: string, textSplitterConfig: TextSplitterConfig) {
        this.pdfPath = pdfPath;
        this.textSplitterConfig = textSplitterConfig;
    }

    async loadAndSplit() {
        const loader = new PDFLoader(this.pdfPath);
        const documents = await loader.load();
        console.log(`📄 Loaded ${documents.length} pages from PDF`);

        const splitter = new RecursiveCharacterTextSplitter(this.textSplitterConfig);
        const splittedDocuments = await splitter.splitDocuments(documents);
        console.log(`✂️  Split into ${splittedDocuments.length} chunks`);

        const chunks = splittedDocuments.map(doc => ({
            ...doc,
            metadata: {
                source: doc.metadata.source,
            }
        }));

        return chunks;
    }
}