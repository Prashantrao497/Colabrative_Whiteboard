import React, { useState } from "react";
import axios from "axios";
import "./ChatWithAi.css"; // Use the same style.css for consistency

function ChatWithAi() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessage = { text: userInput, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setUserInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://iiced-mixtral-46-7b-fastapi.hf.space/generate/",
        {
          prompt: userInput,
          history: [],
          system_prompt:
            "Generate a response for the question given. Provide a concise answer and don't say anything else",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const botMessage = { text: response.data.response, sender: "bot" };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage = {
        text: "Sorry, I could not fetch a response.",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <header>Chat with AI</header>
      <div id="messages" className={messages.length > 4 ? "scrollable" : ""}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-sender">{message.sender.toUpperCase()}</div>
            <div className="message-text">{message.text}</div>
          </div>
        ))}
        {loading && <div className="loading-indicator">Bot is typing...</div>}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a question..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatWithAi;
