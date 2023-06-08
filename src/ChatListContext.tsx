import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { set, z } from "zod";

const ChatCompletionRequestMessageRoleEnum = z.enum([
  "system",
  "user",
  "assistant",
]);
const ChatCompletionRequestMessage = z.object({
  role: ChatCompletionRequestMessageRoleEnum,
  content: z.string(),
  name: z.string().optional(),
});
export type ChatCompletionRequestMessageType = z.infer<
  typeof ChatCompletionRequestMessage
>;
const ChatId = z
  .string()
  .brand("ChatId")
  .default(() => crypto.randomUUID());
export type ChatIdType = z.infer<typeof ChatId>;
export const ChatSchema = z.object({
  id: ChatId,
  messages: z
    .array(ChatCompletionRequestMessage)
    .default([{ role: "system", content: "あなたは親切なアシスタントです。" }]),
  createdAt: z.coerce.date().default(() => new Date()),
  title: z.string().default("New Chat"),
});
export type ChatType = z.infer<typeof ChatSchema>;
type ChatListContextType = {
  chatList: ChatType[];
  activeMessageId: ChatIdType;
  setActiveMessageId: (id: ChatIdType) => void;
  messages: ChatCompletionRequestMessageType[];
  setMessages: (messages: ChatCompletionRequestMessageType[]) => void;
  setTitle: (title: string) => void;
  createNewChat: () => void;
  deleteChat: (id: ChatIdType) => void;
};
const ChatListContext = createContext<ChatListContextType>({
  chatList: [],
  activeMessageId: "" as ChatIdType,
  setActiveMessageId: () => {},
  messages: [],
  setMessages: () => {},
  setTitle: () => {},
  createNewChat: () => {},
  deleteChat: () => {},
});

export const ChatListProvider = ({ children }: { children: ReactNode }) => {
  const chatListString = localStorage.getItem("chatList");
  const initialChatList = ChatSchema.array().parse(
    (chatListString && JSON.parse(chatListString)) ?? [{}]
  );

  const [chatList, setChatList] = useState<ChatType[]>(initialChatList);
  const [activeMessageId, setActiveMessageId] = useState<ChatIdType>(
    chatList[0].id
  );
  const messages = useMemo(
    () => chatList.find((chat) => chat.id === activeMessageId)!.messages,
    [chatList, activeMessageId]
  );

  const createNewChat = useCallback(() => {
    const newChat = ChatSchema.parse({});
    setChatList((prev) => [newChat].concat(prev));
    setActiveMessageId(newChat.id);
  }, []);

  const setMessages = useCallback(
    (messages: ChatCompletionRequestMessageType[]) => {
      setChatList((prev) =>
        prev.map((chat) => {
          if (chat.id === activeMessageId) {
            return ChatSchema.parse({ ...chat, messages });
          }
          return chat;
        })
      );
    },
    [activeMessageId]
  );

  const setTitle = useCallback(
    (title: string) => {
      setChatList((prev) =>
        prev.map((chat) => {
          if (chat.id === activeMessageId) {
            return ChatSchema.parse({ ...chat, title });
          }
          return chat;
        })
      );
    },
    [activeMessageId]
  );

  const deleteChat = useCallback(
    (id: ChatIdType) => {
      if (chatList.length === 1) {
        return;
      }
      setChatList((prev) => prev.filter((chat) => chat.id !== id));
    },
    [chatList]
  );

  useEffect(() => {
    localStorage.setItem("chatList", JSON.stringify(chatList));
  }, [chatList]);

  return (
    <ChatListContext.Provider
      value={{
        chatList,
        activeMessageId,
        setActiveMessageId,
        messages,
        setMessages,
        setTitle,
        createNewChat,
        deleteChat,
      }}
    >
      {children}
    </ChatListContext.Provider>
  );
};

export const useChatList = () => useContext(ChatListContext);
