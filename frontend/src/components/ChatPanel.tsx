import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ChatMessage, Source, User } from "../types";

interface Props {
  user: User;
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string) => Promise<void>;
}

const suggestions = [
  "What does the remedial classes notice say?",
  "What topics are in the updated DSA syllabus?",
  "When is the Raksha Bandhan holiday?",
  "What information is given in the Orientation Programme Notice?"
];

function SourceList({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="source-list">
      <div className="source-label">SOURCES</div>
      {sources.map((source, index) => (
        <div className="source-chip" key={`${source.document_id}-${index}`}>
          <span className="source-file-icon">▤</span>
          <span className="source-title">{source.title}</span>
          {source.page ? <span className="source-page">Page {source.page}</span> : null}
        </div>
      ))}
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  return (
    <article className={`message-row ${isAssistant ? "assistant-message" : "user-message"}`}>
      <div className={`message-avatar ${isAssistant ? "assistant-avatar" : "user-avatar"}`}>
        {isAssistant ? "C" : "Y"}
      </div>
      <div className="message-body">
        <div className="message-meta">
          <strong>{isAssistant ? "CampusGPT" : "You"}</strong>
          {isAssistant && message.grounded !== null && message.grounded !== undefined && (
            <span className={`grounded-pill ${message.grounded ? "is-grounded" : "not-grounded"}`}>
              <span className="ground-dot" />{message.grounded ? "Source-grounded" : "No source found"}
            </span>
          )}
        </div>
        <div className="message-content">{message.content}</div>
        {isAssistant && <SourceList sources={message.sources || []} />}
      </div>
    </article>
  );
}

export default function ChatPanel({ user, messages, busy, onSend }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await onSend(text);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <section className="chat-view">
      <header className="topbar">
        <div>
          <div className="topbar-title">AI assistant <span className="live-dot" /></div>
          <div className="topbar-subtitle">Grounded answers from campus documents</div>
        </div>
        <div className="topbar-user">
          <span className="status-dot" /> Signed in as <strong>{user.role}</strong>
        </div>
      </header>

      <div className="chat-scroll">
        <div className={`chat-inner ${messages.length === 0 ? "welcome-inner" : ""}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">C</div>
              <p className="eyebrow">YOUR CAMPUS KNOWLEDGE ASSISTANT</p>
              <h1>What can I help you <span>find?</span></h1>
              <p className="welcome-copy">Ask a question about notices, schedules, holidays or course material. Answers are based on the documents your account is allowed to access.</p>
              <div className="suggestion-grid">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} className="suggestion-card" onClick={() => void onSend(suggestion)} disabled={busy}>
                    <span>{suggestion}</span><span className="suggestion-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => <Message key={message.id} message={message} />)}
            </div>
          )}

          {busy && (
            <div className="typing-row">
              <div className="message-avatar assistant-avatar">C</div>
              <div className="typing-indicator"><span /><span /><span /></div>
              <span className="muted tiny">Checking campus documents…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="composer-wrap">
        <form className="composer" onSubmit={submit}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a notice, timetable, holiday or syllabus…"
            rows={1}
            maxLength={4000}
            aria-label="Your message"
            disabled={busy}
          />
          <button className="send-button" type="submit" disabled={busy || !input.trim()} aria-label="Send message">
            {busy ? "…" : "↑"}
          </button>
        </form>
        <div className="composer-foot"><span>Enter to send · Shift + Enter for a new line</span><span>{input.length}/4000</span></div>
      </div>
    </section>
  );
}
