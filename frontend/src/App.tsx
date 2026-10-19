import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import DocumentsPanel from "./components/DocumentsPanel";
import UsersPanel from "./components/UsersPanel";
import type { ChatMessage, Conversation, User } from "./types";

type View = "chat" | "documents" | "users";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [view, setView] = useState<View>("chat");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshConversations = useCallback(async () => {
    try {
      const result = await api.listConversations();
      setConversations(result.conversations);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load conversations.");
    }
  }, []);

  useEffect(() => {
    api.me()
      .then(async ({ user: authenticated }) => {
        setUser(authenticated);
        const result = await api.listConversations();
        setConversations(result.conversations);
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  function authenticated(authenticatedUser: User) {
    setUser(authenticatedUser);
    setError("");
    void refreshConversations();
  }

  async function logout() {
    try { await api.logout(); } catch { /* Clear local state even if the server session expired. */ }
    setUser(null);
    setMessages([]);
    setConversations([]);
    setActiveConversationId(null);
    setView("chat");
  }

  function newChat() {
    setActiveConversationId(null);
    setMessages([]);
    setView("chat");
    setError("");
  }

  async function selectConversation(id: string) {
    setView("chat");
    setActiveConversationId(id);
    setError("");
    setBusy(true);
    try {
      const result = await api.getMessages(id);
      setMessages(result.messages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load this conversation.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteConversation(id: string) {
    const conversation = conversations.find((item) => item.id === id);
    if (!window.confirm(`Delete "${conversation?.title || "this conversation"}"?`)) return;
    try {
      await api.deleteConversation(id);
      setConversations((current) => current.filter((item) => item.id !== id));
      if (activeConversationId === id) newChat();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete this conversation.");
    }
  }

  async function sendMessage(text: string) {
    if (busy) return;
    setError("");
    setView("chat");

    const tempId = `temp-${Date.now()}`;
    setMessages((current) => [...current, {
      id: tempId,
      role: "user",
      content: text
    }]);
    setBusy(true);

    try {
      const result = await api.chat(text, activeConversationId);
      setActiveConversationId(result.conversationId);
      setMessages((current) => [
        ...current.filter((item) => item.id !== tempId),
        { id: tempId, role: "user", content: text },
        {
          id: result.messageId,
          role: "assistant",
          content: result.answer,
          sources: result.sources || [],
          grounded: result.grounded,
          query_type: result.query_type,
          created_at: result.createdAt
        }
      ]);
      await refreshConversations();
    } catch (caught) {
      setMessages((current) => [
        ...current.filter((item) => item.id !== tempId),
        { id: tempId, role: "user", content: text }
      ]);
      setError(caught instanceof Error ? caught.message : "Could not send this message.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return <div className="page-loading"><span className="loading-orb">C</span><p>Connecting to CampusGPT</p></div>;
  }

  if (!user) {
    return (
      <>
        {error && <div className="floating-error" role="alert">{error}</div>}
        <AuthScreen onAuthenticated={authenticated} onError={setError} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        conversations={conversations}
        activeId={activeConversationId}
        view={view}
        onNewChat={newChat}
        onSelectConversation={selectConversation}
        onViewChange={setView}
        onLogout={logout}
        onDeleteConversation={deleteConversation}
      />
      <main className="main-area">
        {error && <div className="inline-error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error">x</button></div>}
        {view === "chat" && <ChatPanel user={user} messages={messages} busy={busy} onSend={sendMessage} />}
        {view === "documents" && <DocumentsPanel user={user} onError={setError} />}
        {view === "users" && user.role === "admin" && <UsersPanel onError={setError} />}
      </main>
    </div>
  );
}
