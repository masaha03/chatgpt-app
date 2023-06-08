import { useCallback } from "react";
import { ChatType, useChatList } from "./ChatListContext";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const { chatList, createNewChat } = useChatList();

  return (
    <aside className={styles.sidebar}>
      <button type="button" onClick={createNewChat}>
        新しいChatを開始する
      </button>
      {chatList.map((chat) => (
        <ChatListItem key={chat.id} chat={chat} />
      ))}
    </aside>
  );
}

function ChatListItem({ chat }: { chat: ChatType }) {
  const { activeMessageId, setActiveMessageId, deleteChat } = useChatList();

  const handleClick = useCallback(() => {
    setActiveMessageId(chat.id);
  }, [chat.id, setActiveMessageId]);

  return (
    <div
      className={
        styles.chat + " " + (activeMessageId === chat.id ? styles.active : "")
      }
    >
      <button type="button" onClick={handleClick}>
        {chat.title}
      </button>

      <button type="button" title="削除" onClick={() => deleteChat(chat.id)}>
        <i className="bi bi-trash"></i>
      </button>
    </div>
  );
}
