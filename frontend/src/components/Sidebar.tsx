import type { Conversation, User } from "../types";

interface Props {
  user: User;
  conversations: Conversation[];
  activeId: string | null;
  view: "chat" | "documents" | "users";
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onViewChange: (view: "chat" | "documents" | "users") => void;
  onLogout: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  user, conversations, activeId, view, onNewChat, onSelectConversation,
  onViewChange, onLogout, onDeleteConversation
}: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">C</span>
        <span>CampusGPT</span>
      </div>

      <button className="button button-primary new-chat" onClick={onNewChat}>
        <span className="plus">＋</span> New conversation
      </button>

      <nav className="primary-nav" aria-label="Main navigation">
        <button className={`nav-item ${view === "chat" ? "active" : ""}`} onClick={() => onViewChange("chat")}>
          <span className="nav-symbol">✳</span> AI assistant
        </button>
        <button className={`nav-item ${view === "documents" ? "active" : ""}`} onClick={() => onViewChange("documents")}>
          <span className="nav-symbol">▤</span> Documents
        </button>
        {user.role === "admin" && (
          <button className={`nav-item ${view === "users" ? "active" : ""}`} onClick={() => onViewChange("users")}>
            <span className="nav-symbol">♙</span> User access
          </button>
        )}
      </nav>

      <div className="side-section">
        <div className="section-heading"><span>RECENT CHATS</span><span className="count-pill">{conversations.length}</span></div>
        <div className="conversation-list">
          {conversations.length === 0 && <p className="side-empty">Your conversations will appear here.</p>}
          {conversations.map((conversation) => (
            <div className={`conversation-row ${activeId === conversation.id && view === "chat" ? "selected" : ""}`} key={conversation.id}>
              <button className="conversation-link" onClick={() => onSelectConversation(conversation.id)} title={conversation.title}>
                <span className="conversation-dot">◦</span>
                <span>{conversation.title}</span>
              </button>
              <button className="icon-button delete-conversation" title="Delete conversation" aria-label={`Delete ${conversation.title}`} onClick={() => onDeleteConversation(conversation.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-spacer" />
      <div className="sidebar-footer">
        <div className="profile-avatar">{user.fullName.slice(0, 1).toUpperCase()}</div>
        <div className="profile-info">
          <strong title={user.fullName}>{user.fullName}</strong>
          <span>{user.role}</span>
        </div>
        <button className="icon-button logout-button" onClick={onLogout} title="Sign out" aria-label="Sign out">↗</button>
      </div>
    </aside>
  );
}
