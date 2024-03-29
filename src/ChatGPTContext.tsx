//ChatGPTのResponseを管理するコンテキストを定義
// src/ChatGPTContext.tsx
import { ReactNode, createContext, useContext, useState } from "react";
import {
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
} from "openai";
import {
  ChatCompletionRequestMessageType,
  useChatList,
} from "./ChatListContext";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: import.meta.env.VITE_APIKEY,
});
const openai = new OpenAIApi(configuration);

export async function* fetchGPTCompressionStearm(
  apiKey: string,
  messages: ChatCompletionRequestMessageType[],
  abortSignal: AbortSignal
): AsyncGenerator<CreateCompletionResponseStream> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    signal: abortSignal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
    body: JSON.stringify({
      messages,
      model: "gpt-4",
      stream: true,
    } satisfies CreateChatCompletionRequest),
  });

  if (res.status !== 200 || res.body === null) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const decoder = new TextDecoder("utf-8");

  const reader = res.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      const chunk = decoder.decode(value, { stream: true });
      const completions = chunk
        .split("data:")
        .map((data: any) => {
          const trimData = data.trim();
          if (trimData === "" || trimData === "[DONE]") {
            return undefined;
          }
          return JSON.parse(trimData);
        })
        .filter(
          (data: any): data is CreateCompletionResponseStream =>
            data !== undefined
        );
      for (const completion of completions) {
        yield completion;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export type CreateCompletionResponseStream = Omit<
  CreateChatCompletionResponse,
  "choices"
> & {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string;
    index: number;
  }>;
};

type ChatGPTContextType = {
  messages: ChatCompletionRequestMessageType[];
  setMessages: (messages: ChatCompletionRequestMessageType[]) => void;
  response: CreateChatCompletionResponse | null;
  setResponse: (response: CreateChatCompletionResponse | null) => void;
  running: {
    controller: AbortController;
  } | null;
  errorMessage: string;
  send: (text: string, index?: number) => Promise<void> | void;
};

const ChatGPTContext = createContext<ChatGPTContextType>({
  messages: [],
  setMessages: () => {},
  response: null,
  setResponse: () => {},
  running: null,
  errorMessage: "",
  send: () => {},
});

export const ChatGPTProvider = ({ children }: { children: ReactNode }) => {
  const { messages, setMessages, setTitle } = useChatList();
  const [response, setResponse] = useState<CreateChatCompletionResponse | null>(
    null
  );

  const [running, setRunning] = useState<{
    controller: AbortController;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const send = async (text: string, index?: number) => {
    const nextMessages = messages
      .slice(0, index ?? messages.length)
      .concat([{ role: index === 0 ? "system" : "user", content: text }]);

    if (index === 0) {
      setMessages(nextMessages);
      return;
    }

    const controller = new AbortController();
    setRunning({ controller });
    let output = "";
    try {
      const iter = fetchGPTCompressionStearm(
        import.meta.env.VITE_APIKEY,
        nextMessages,
        controller.signal
      );
      for await (const cmpl of iter) {
        if (cmpl.choices[0].delta.content == null) continue;
        output += cmpl.choices[0].delta.content;
        setMessages(
          nextMessages.concat({ role: "assistant", content: output })
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          return;
        }
        setErrorMessage(err.message);
      }
      console.error(err);
    } finally {
      setRunning(null);
    }

    if (nextMessages.length === 2) {
      const prompt = nextMessages[1].content;

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a chat bot that generates a Japanese title that summarizes the prompt. When responding, please answer only with the generated title.",
          },
          {
            role: "user",
            content: "Please summarize the following prompts: \n" + prompt,
          },
        ],
      });
      setTitle(response.data.choices[0].message!.content);
    }
  };

  return (
    <ChatGPTContext.Provider
      value={{
        messages,
        setMessages,
        response,
        setResponse,
        running,
        errorMessage,
        send,
      }}
    >
      {children}
    </ChatGPTContext.Provider>
  );
};

export const useChatGPT = () => useContext(ChatGPTContext);
