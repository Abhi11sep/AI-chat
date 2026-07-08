import { useEffect, useRef, useState } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'
import { IoSend } from "react-icons/io5";
import { IoMenu } from "react-icons/io5";

function App() {
  const bottomRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chat, setChat] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const firstChatId = Date.now();
  const [chatHistory, setChatHistory] = useState([
    {
      id: firstChatId,
      title: "New Chat",
      messages: [],
    },
  ]);

  const [activeChat, setActiveChat] = useState(firstChatId);


  const sendMessage = async () => {
    try {

      console.log(import.meta.env);
      console.log(import.meta.env.VITE_API_URL);
      const currentMessage = chat.trim();

      if (!currentMessage) return;

      setIsStreaming(true);


      if (!activeConversation) return;

      const updatedMessages = [
        ...activeConversation.messages,
        {
          role: "user",
          content: currentMessage,
        },
        {
          role: "assistant",
          content: "",
        },
      ];

      // Update React state immediately
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? {
              ...chat,
              title: chat.title === "New Chat" ? currentMessage.slice(0, 25) : chat.title,
              messages: updatedMessages,
            }
            : chat
        )
      );

      setChat("");

      // the conversation
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(0, -1),
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        console.log(chunk)

        setChatHistory(prev =>
          prev.map(chat => {
            if (chat.id !== activeChat) return chat;

            const msgs = [...chat.messages];

            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: msgs[msgs.length - 1].content + chunk,
            };

            return {
              ...chat,
              messages: msgs,
            };
          })
        );
      }

      setIsStreaming(false);

    } catch (err) {
      console.error(err);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setChatHistory(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
  };

  const activeConversation = chatHistory.find(
    chat => chat.id === activeChat
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "instant",
    });
  }, [activeConversation?.messages.length]);


  return (


    <div className="h-screen bg-zinc-900 text-white flex">


      {/* ================= Overlay ================= */}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 md:hidden z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ================= Sidebar ================= */}

      <div className={`fixed md:static top-0 left-0 h-full w-72 bg-zinc-900 border-r border-zinc-700
    z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0 flex flex-col `} >

        <div className="p-4 border-b border-zinc-700">
          <button onClick={() => { createNewChat(); setSidebarOpen(false); }} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl py-3 transition">
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => { setActiveChat(chat.id); setSidebarOpen(false); }}
              className={`cursor-pointer rounded-lg p-3 transition ${activeChat === chat.id
                ? "bg-zinc-800"
                : "hover:bg-zinc-800"
                }`}
            >
              {chat.title}
            </div>
          ))}

        </div>

      </div>

      {/* ================= Chat Section ================= */}

      <div className="flex-1 flex flex-col md:ml-0">

        {/* Header */}

        <div className="border-b border-zinc-700 p-4 flex items-center justify-between">

          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <IoMenu size={28} />
          </button>

          <h1 className="font-semibold text-lg">
            AI Chat • Abhishek
          </h1>

          <div className="w-7 md:hidden"></div>

        </div>

        {/* Messages */}

        <div className="flex-1 overflow-y-auto">

          <div className="max-w-4xl w-full mx-auto p-6 space-y-6">


            {activeConversation?.messages.map((msg, index) => (

              <div
                key={index}
                className={`flex ${msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
                  }`}
              >

                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 whitespace-pre-wrap ${msg.role === "user"
                    ? "bg-blue-500"
                    : "bg-zinc-800"
                    }`}
                >

                  <p className="text-xs opacity-60 mb-2">
                    {msg.role === "user"
                      ? "👤 You"
                      : "🤖 AI"}
                  </p>

                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>

                  {index === activeConversation?.messages.length - 1 &&
                    msg.role === "assistant" &&
                    isStreaming && (
                      <span className="animate-pulse text-xl">
                        ▌
                      </span>
                    )}

                </div>

              </div>

            ))}

          </div>
          <div ref={bottomRef}></div>
        </div>

        {/* Input */}

        <div className="border-t border-zinc-700 p-5">

          <div className="max-w-4xl w-full mx-auto flex items-end gap-2 px-2">

            <textarea className="flex-1 resize-none rounded-xl bg-zinc-800 border border-zinc-700
                    px-4 py-3 outline-none focus:border-blue-500 text-sm md:text-base"
              rows={1}
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Anything... (Enter to send • Shift+Enter for new line)"
              className="flex-1 resize-none rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
              onClick={sendMessage}
              className="h-12 w-12 md:h-[52px] md:w-[52px] rounded-xl bg-blue-600 hover:bg-blue-700
                              flex items-center justify-center"
            >
              <IoSend size={20} />
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

export default App
