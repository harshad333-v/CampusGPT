import { useCallback, useEffect, useRef, useState } from "react";

import {
  createChatSession,
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  renameChatSession,
  deleteChatSession,
} from "../api/chat";

import StudentSidebar from "../components/StudentSidebar";

import ChatWelcome from "../components/chat/ChatWelcome";

import ChatInput from "../components/chat/ChatInput";

import ChatMessages from "../components/chat/ChatMessages";

import ChatSidebar from "../components/chat/ChatSidebar";

import ChatHeader from "../components/chat/ChatHeader";


/* =========================================================
   ICONS
========================================================= */

const SUGGESTED_PROMPTS = [
  {
    title: "Study & Exam Prep",
    description: "Summarize lecture notes, create quick revision guides, and practice exam questions.",
    starterText: "Help me summarize my notes and create a revision cheat sheet for upcoming exams."
  },
  {
    title: "Explain Complex Concepts",
    description: "Break down difficult topics, theories, or formulas in simple, step-by-step terms.",
    starterText: "Explain this concept step-by-step with real-world examples: "
  },
  {
    title: "Assignments & Project Ideas",
    description: "Brainstorm project topics, outline reports, and debug programming code.",
    starterText: "Help me brainstorm project ideas and create a project structure for: "
  },
  {
    title: "Ask CampusGPT Anything",
    description: "Ask questions about campus queries, syllabus guidance, or general academic doubt solving.",
    starterText: "I have a question regarding my coursework: "
  }
];

/* =========================================================
   CHAT COMPONENT
========================================================= */

function Chat() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /* Dark Mode */

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  /* Voice */

  const [speechSupported] = useState(() => {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  const [isListening, setIsListening] = useState(false);

  /* Rename */

  const [editingTitleId, setEditingTitleId] = useState(null);

  const [editingTitle, setEditingTitle] = useState("");

  /* Delete */

  const [deletingSessionId, setDeletingSessionId] = useState(null);

  /* Edit Message */

  const [editingMessageId, setEditingMessageId] = useState(null);

  const [editingMessage, setEditingMessage] = useState("");

  /* Copy */

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  /* Feedback */

  const [messageFeedback, setMessageFeedback] = useState({});

  /* Menu */

  const [openMenuId, setOpenMenuId] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  /* Refs */

  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceBaseTextRef = useRef("");

  /* =========================================================
     LOAD CHAT SESSIONS
  ========================================================= */

  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setError("");

      const response = await getChatSessions();

      if (!response.success) {
        setError(response.message || "Unable to load chats.");

        return;
      }

      setSessions(response.data || []);
    } catch (err) {
      console.error("Chat sessions error:", err);

      setError("Unable to load chats.");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /* =========================================================
     VOICE RECOGNITION
  ========================================================= */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      setIsListening(false);

      if (event.error === "not-allowed") {
        setError(
          "Microphone access was denied. Please allow microphone permission.",
        );
      }

      if (event.error === "service-not-allowed") {
        setError("Voice recognition service is not available in this browser.");
      }
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }

      const baseText = voiceBaseTextRef.current;

      setInput(`${baseText}${baseText && transcript ? " " : ""}${transcript}`);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  /* =========================================================
     AUTO RESIZE TEXTAREA
  ========================================================= */

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  /* =========================================================
     VOICE INPUT
  ========================================================= */

  function handleVoiceInput() {
    if (!speechSupported) {
      setError(
        "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );

      return;
    }

    if (!recognitionRef.current) {
      setError("Voice recognition is currently unavailable.");

      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        setError("");

        voiceBaseTextRef.current = input;

        recognitionRef.current.start();
      }
    } catch (err) {
      console.error("Voice recognition error:", err);
    }
  }

  /* =========================================================
     CREATE CHAT
  ========================================================= */

  async function handleCreateChat() {
    try {
      setError("");

      const response = await createChatSession();

      if (!response.success) {
        setError(response.message || "Unable to create chat.");

        return;
      }

      const newSession = response.data;

      setSessions((previousSessions) => [newSession, ...previousSessions]);

      setSelectedSession(newSession);
      setMessages([]);
      setInput("");
      setOpenMenuId(null);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error("Create chat error:", err);

      setError("Unable to create chat.");
    }
  }

  /* =========================================================
     SELECT SESSION
  ========================================================= */

  async function handleSelectSession(session) {
    try {
      setError("");
      setLoadingMessages(true);

      setSelectedSession(session);

      setEditingMessageId(null);
      setEditingMessage("");
      setOpenMenuId(null);

      const response = await getChatMessages(session._id);

      if (!response.success) {
        setError(response.message || "Unable to load messages.");

        return;
      }

      setMessages(response.data || []);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error("Load messages error:", err);

      setError("Unable to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!input.trim() || sending) {
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const userMessage = input.trim();
    
    try {
      setSending(true);
      setError("");
      setInput("");
      
      let currentSession = selectedSession;
      
      if (!currentSession) {
        const createResponse = await createChatSession();
        if (!createResponse.success) {
          setError(createResponse.message || "Unable to create chat.");
          setInput(userMessage);
          setSending(false);
          return;
        }
        currentSession = createResponse.data;
        setSessions((prev) => [currentSession, ...prev]);
        setSelectedSession(currentSession);
        setMessages([]);
      }

      const response = await sendChatMessage(currentSession._id, userMessage);

      if (!response.success) {
        setError(response.message || "Unable to send message.");

        setInput(userMessage);

        return;
      }

      const updatedMessages = await getChatMessages(selectedSession._id);

      if (updatedMessages.success) {
        setMessages(updatedMessages.data || []);
      }

      await loadSessions();
    } catch (err) {
      console.error("Send message error:", err);

      setError("Unable to send message.");

      setInput(userMessage);
    } finally {
      setSending(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }

  /* =========================================================
     KEYBOARD
  ========================================================= */

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (input.trim() && !sending) {
        handleSendMessage(event);
      }
    }
  }

  /* =========================================================
     RENAME SESSION
  ========================================================= */

  async function handleRenameSession(session) {
    const title = editingTitle.trim();

    if (!title) {
      return;
    }

    try {
      setError("");

      const response = await renameChatSession(session._id, title);

      if (!response.success) {
        setError(response.message || "Unable to rename chat.");

        return;
      }

      const updatedSession = {
        ...session,
        title,
      };

      setSessions((previousSessions) =>
        previousSessions.map((item) =>
          item._id === session._id ? updatedSession : item,
        ),
      );

      if (selectedSession?._id === session._id) {
        setSelectedSession(updatedSession);
      }

      setEditingTitleId(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Rename chat error:", err);

      setError("Unable to rename chat.");
    }
  }

  /* =========================================================
     DELETE SESSION
  ========================================================= */

  async function handleDeleteSession(sessionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      setError("");

      const response = await deleteChatSession(sessionId);

      if (!response.success) {
        setError(response.message || "Unable to delete chat.");

        return;
      }

      setSessions((previousSessions) =>
        previousSessions.filter((session) => session._id !== sessionId),
      );

      if (selectedSession?._id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete chat error:", err);

      setError("Unable to delete chat.");
    } finally {
      setDeletingSessionId(null);
      setOpenMenuId(null);
    }
  }

  /* =========================================================
     CLEAR ALL CHATS
  ========================================================= */

  async function handleClearAllChats() {
    if (sessions.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all chats? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const results = await Promise.all(
        sessions.map((session) => deleteChatSession(session._id)),
      );

      const failedDelete = results.some((response) => !response.success);

      if (failedDelete) {
        setError("Some chats could not be deleted. Please try again.");

        await loadSessions();

        return;
      }

      setSessions([]);
      setSelectedSession(null);
      setMessages([]);
      setOpenMenuId(null);
      setEditingTitleId(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Clear all chats error:", err);

      setError("Unable to clear all chats.");

      await loadSessions();
    }
  }

  /* =========================================================
     COPY MESSAGE
  ========================================================= */

  async function handleCopyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.message);

      setCopiedMessageId(message._id);

      setTimeout(() => {
        setCopiedMessageId(null);
      }, 1500);
    } catch (err) {
      console.error("Copy message error:", err);

      setError("Unable to copy message.");
    }
  }

  /* =========================================================
     MESSAGE FEEDBACK
  ========================================================= */

  function handleMessageFeedback(messageId, feedback) {
    setMessageFeedback((previousFeedback) => ({
      ...previousFeedback,
      [messageId]: previousFeedback[messageId] === feedback ? null : feedback,
    }));
  }

  /* =========================================================
     EDIT MESSAGE
  ========================================================= */

  function handleStartEditMessage(message) {
    setEditingMessageId(message._id);
    setEditingMessage(message.message);
  }

  function handleCancelEditMessage() {
    setEditingMessageId(null);
    setEditingMessage("");
  }

  function handleSaveEditMessage(messageId) {
    const updatedText = editingMessage.trim();

    if (!updatedText) {
      return;
    }

    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        message._id === messageId
          ? {
              ...message,
              message: updatedText,
              edited: true,
            }
          : message,
      ),
    );

    setEditingMessageId(null);
    setEditingMessage("");
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-[#090b10]">
      {/* =====================================================
          MAIN DASHBOARD SIDEBAR
      ===================================================== */}

      <StudentSidebar hideOnMobile={true} />

      <main className="h-screen lg:ml-64">
        <div className="flex h-full flex-col overflow-hidden">
          {/* =================================================
              TOP HEADER
          ================================================= */}

          <ChatHeader
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onCreateChat={handleCreateChat}
            onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          />

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mx-5 mt-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 lg:mx-8">
              {error}
            </div>
          )}

          {/* =================================================
              THREE AREA LAYOUT
              1. Dashboard Sidebar
              2. Recent Chats
              3. Main Chat
          ================================================= */}

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* =============================================
                RECENT CHATS SIDEBAR
            ============================================= */}

            <ChatSidebar
              sessions={sessions}
              selectedSession={selectedSession}
              loadingSessions={loadingSessions}
              editingTitleId={editingTitleId}
              editingTitle={editingTitle}
              deletingSessionId={deletingSessionId}
              openMenuId={openMenuId}
              isMobileMenuOpen={isMobileDrawerOpen}
              setEditingTitle={setEditingTitle}
              setEditingTitleId={setEditingTitleId}
              setOpenMenuId={setOpenMenuId}
              setIsMobileMenuOpen={setIsMobileDrawerOpen}
              onCreateChat={handleCreateChat}
              onSelectSession={(session) => {
                handleSelectSession(session);
                setIsMobileDrawerOpen(false);
              }}
              onRenameSession={handleRenameSession}
              onDeleteSession={handleDeleteSession}
              onClearAllChats={handleClearAllChats}
            />

            {/* =============================================
                MAIN CHAT AREA
            ============================================= */}

            <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 dark:bg-[#090b10]">
              {selectedSession ? (
                <>
                  {/* =========================================
                      CHAT TITLE BAR
                  ========================================= */}

                  <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/[0.06] dark:bg-[#0d1017] lg:px-8">
                    <div className="mx-auto flex max-w-5xl items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white dark:bg-blue-600">
                        AI
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Conversation
                        </p>

                        <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedSession.title || "Untitled Chat"}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* =========================================
                      MESSAGES
                  ========================================= */}

                  <div
                    ref={messagesContainerRef}
                    className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8"
                  >
                    <ChatMessages
                      messages={messages}
                      loadingMessages={loadingMessages}
                      sending={sending}
                      editingMessageId={editingMessageId}
                      editingMessage={editingMessage}
                      setEditingMessage={setEditingMessage}
                      copiedMessageId={copiedMessageId}
                      messageFeedback={messageFeedback}
                      onCopyMessage={handleCopyMessage}
                      onStartEditMessage={handleStartEditMessage}
                      onCancelEditMessage={handleCancelEditMessage}
                      onSaveEditMessage={handleSaveEditMessage}
                      onMessageFeedback={handleMessageFeedback}
                    />
                  </div>
                </>
              ) : (
                /* =============================================
                    WELCOME SCREEN
                ============================================= */
                <div className="flex flex-1 flex-col px-6 pb-2">
                  <div className="flex flex-1 flex-col items-center justify-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white shadow-xl dark:bg-blue-600 dark:shadow-blue-950/30">
                      AI
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
                      How can I help you today?
                    </h2>
                  </div>

                  <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
                    {SUGGESTED_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInput(prompt.starterText);
                          setTimeout(() => {
                            textareaRef.current?.focus();
                          }, 10);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.06] dark:bg-[#0d1017] dark:text-slate-300 dark:hover:bg-white/[0.04]"
                      >
                        {prompt.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================
                  INPUT AREA
              ========================================= */}
              <ChatInput
                input={input}
                setInput={setInput}
                sending={sending}
                isListening={isListening}
                textareaRef={textareaRef}
                onSubmit={handleSendMessage}
                onKeyDown={handleInputKeyDown}
                onVoiceInput={handleVoiceInput}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;
