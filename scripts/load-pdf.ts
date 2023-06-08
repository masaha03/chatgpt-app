import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { z } from "zod";

const directory = "scripts/vectorStore";

async function loadDocuments() {
  console.info("start loading documents");
  const loader = new DirectoryLoader("scripts/assets", {
    ".pdf": (path) => new PDFLoader(path),
  });

  const docs = await loader.loadAndSplit(
    new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 100 })
  );

  // Load the docs into the vector store
  const vectorStore = await HNSWLib.fromDocuments(
    docs,
    new OpenAIEmbeddings({
      openAIApiKey: "openai-api-key",
    })
  );

  console.info("loading completed");
  await vectorStore.save(directory);
  console.info("saving completed");
  return vectorStore;
}

async function loadSavedStore() {
  console.info("start loading saved store");
  const store = await HNSWLib.load(
    directory,
    new OpenAIEmbeddings({
      openAIApiKey: "openai-api-key",
    })
  );
  console.info("loading completed");
  return store;
}

const chat = new OpenAI({
  temperature: 0,
  modelName: "gpt-3.5-turbo",
  openAIApiKey: "openai-api-key",
});

// const vectorStore = await loadDocuments();
const vectorStore = await loadSavedStore();

const chain = ConversationalRetrievalQAChain.fromLLM(
  chat,
  vectorStore.asRetriever(),
  {
    returnSourceDocuments: true,
    questionGeneratorTemplate:
      "Using the following context, answer the last question in Japanese. If you do not know the answer, do not try to make up an answer, just say you do not know.",
  }
);

/* Ask it a question */
const question = "アートのビジネス活用についてまとめてください。";
const res = await chain.call({ question, chat_history: [] });
const Response = z.object({
  text: z.string(),
  sourceDocuments: z.array(
    z.object({
      pageContent: z.string(),
      metadata: z.object({
        source: z.string(),
        pdf: z.object({
          version: z.string(),
          info: z.any(),
          metadata: z.any(),
          totalPages: z.number(),
        }),
        loc: z.object({
          pageNumber: z.number(),
          lines: z.object({ from: z.number(), to: z.number() }),
        }),
      }),
    })
  ),
});

const parsed = Response.parse(res);
