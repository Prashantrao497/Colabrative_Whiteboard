import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./Chat.css";

const socket = io("http://localhost:5000"); // Connect to backend

function Chat({ user }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Get the current roomId
    const roomId = user.roomId;

    // Load messages specific to the current room
    const savedMessages = JSON.parse(
      localStorage.getItem(`chatMessages_${roomId}`)
    );
    if (savedMessages) {
      setMessages(savedMessages);
    }

    // Listen for incoming messages from the server specific to the room
    socket.on("chat message", (msg) => {
      // Filter out messages that are for other rooms
      if (msg.roomId === roomId) {
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages, msg];
          // Persist the messages for this specific room to localStorage
          localStorage.setItem(
            `chatMessages_${roomId}`,
            JSON.stringify(newMessages)
          );
          return newMessages;
        });
      }
    });

    return () => {
      socket.off("chat message");
      socket.disconnect();
    };
  }, [user.roomId]); // Re-run effect when roomId changes

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        user: user.userName,
        message: message,
        roomId: user.roomId, // Include roomId with each message
      };

      // Emit the message to the server with roomId
      socket.emit("chat message", newMessage);

      // Clear the input field
      setMessage("");
    }
  };

  // Scroll to the bottom of the messages container when new messages are added
  useEffect(() => {
    const messagesContainer = document.getElementById("messages");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-container">
      <header>Chat Room</header>
      <div id="messages" className={messages.length > 4 ? "scrollable" : ""}>
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>{msg.user}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <form id="chat-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;
