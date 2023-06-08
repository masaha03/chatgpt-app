import styles from "./App.module.css";
import { Input } from "./Input";
import { ChatGPTProvider } from "./ChatGPTContext";
import { Output } from "./Output";
import { Sidebar } from "./Sidebar";
import { ChatListProvider } from "./ChatListContext";

function App() {
  return (
    <ChatListProvider>
      <ChatGPTProvider>
        <div className={styles.container}>
          <Sidebar />
          <main>
            <Output />
            <Input />
          </main>
        </div>
      </ChatGPTProvider>
    </ChatListProvider>
  );
}

export default App;
