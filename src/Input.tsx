import { FormEvent, useState } from "react";
import { useChatGPT } from "./ChatGPTContext";
import styles from "./Input.module.css";
import { createPortal } from "react-dom";

const Spinner = () => {
  return createPortal(
    <div className={styles.spinner}>spinner</div>,
    document.body
  );
};

export function Input() {
  const [text, setText] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const { messages, setMessages, setResponse, running, errorMessage, send } =
    useChatGPT();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsDisabled(e.target.value.length === 0);
  };

  const handleReset = () => {
    setMessages([]);
    setResponse(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await send(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit}>
      {running && <Spinner />}
      <div className="input">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="入力してください"
          className={styles.textarea}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={isDisabled}>
            送信
          </button>
        </div>
        <p>{errorMessage}</p>
      </div>
    </form>
  );
}
