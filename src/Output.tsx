//CreateChatCompletionResponseのChoicesを表示するコンポーネントを定義
import { ChatCompletionRequestMessage } from "openai";
import { useChatGPT } from "./ChatGPTContext";
import styles from "./Output.module.css";
import { useState } from "react";

export function Output() {
  const { messages } = useChatGPT();

  return (
    <div className={styles.output}>
      {messages.map((v, i) => (
        <OutputItem key={i} index={i} message={v} />
      ))}
    </div>
  );
}

function OutputItem({
  index,
  message: { role, content },
}: {
  index: number;
  message: ChatCompletionRequestMessage;
}) {
  const [edit, setEdit] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  const { send } = useChatGPT();

  const update = async () => {
    setEdit(false);
    await send(currentContent, index);
  };

  return (
    <div className={styles[role]}>
      <div className={styles.avator}>
        {role === "system" ? "S" : role === "user" ? "U" : "A"}
      </div>
      <div className={styles.content}>
        {!edit ? (
          <div style={{ width: "100%" }}>{content}</div>
        ) : (
          <textarea
            style={{ width: "100%", height: "10rem", padding: "0.5rem" }}
            title="編集"
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
          />
        )}
        {!edit ? (
          role !== "assistant" && (
            <button type="button" title="編集" onClick={() => setEdit(true)}>
              <i className="bi bi-pencil-square"></i>&ensp;編集
            </button>
          )
        ) : (
          <div>
            <button
              type="button"
              title="キャンセル"
              onClick={() => {
                setEdit(false);
                setCurrentContent(content);
              }}
            >
              <i className="bi bi-x-circle"></i>&ensp;キャンセル
            </button>
            &nbsp;
            <button type="button" title="更新" onClick={update}>
              <i className="bi bi-save"></i>&ensp;更新
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
