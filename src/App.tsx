import "./App.css";
import { Input } from "./Input";
import { ChatGPTProvider } from "./ChatGPTContext";
import { Output } from "./Output";

function App() {
  return (
    <ChatGPTProvider>
      <div className="container">
        <Output />
        <Input />
      </div>
    </ChatGPTProvider>
  );
}

export default App;
