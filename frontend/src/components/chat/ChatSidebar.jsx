import { useState, useEffect } from "react";
import {
  PlusIcon,
  MoreIcon,
  EditIcon,
  TrashIcon,
} from "./ChatIcons";
import { useNavigate, useLocation } from "react-router-dom";

function ChatSidebar({
  sessions,
  selectedSession,
  loadingSessions,
  editingTitleId,
  editingTitle,
  deletingSessionId,
  openMenuId,

  setEditingTitle,
  setEditingTitleId,
  setOpenMenuId,

  onCreateChat,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onClearAllChats,

  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
  const BotIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>);
  const DocumentIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>);
  const SettingsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>);
  const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>);
  const PinIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>);

  const menuItems = [
    { label: "Dashboard", path: "/student", icon: <HomeIcon /> },
    { label: "Chat", path: "/chat", icon: <BotIcon /> },
    { label: "Documents", path: "/documents", icon: <DocumentIcon /> },
    { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
  ];

  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      const stored = localStorage.getItem("pinnedChats");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("pinnedChats", JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  function handleLogout() {
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-white transition-transform duration-300 dark:bg-[#0d1017] lg:static lg:z-auto lg:flex lg:translate-x-0 lg:border-r lg:border-slate-200 lg:dark:border-white/[0.06] ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* 1. TOP HEADER (MOBILE ONLY) */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-semibold text-white dark:bg-blue-600">
              AI
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              CampusGPT
            </h2>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* 2. NEW CHAT BUTTON (SHARED / DESKTOP vs MOBILE) */}
        <div className="px-4 py-2 lg:pt-4 lg:pb-0 order-2 lg:order-none">
          <button
            type="button"
            onClick={onCreateChat}
            className="flex w-full h-11 lg:h-auto lg:py-3 items-center justify-center gap-2 rounded-xl bg-slate-900 lg:bg-slate-50 lg:border lg:border-slate-200 text-sm font-medium text-white lg:text-slate-700 shadow-sm lg:shadow-none transition hover:bg-slate-800 lg:hover:bg-slate-100 active:scale-[0.98] lg:active:scale-100 dark:bg-blue-600 dark:lg:bg-[#151923] dark:lg:border-white/[0.08] dark:shadow-blue-900/20 lg:dark:shadow-none dark:hover:bg-blue-500 dark:lg:hover:bg-[#1b2030] dark:lg:text-slate-200"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden lg:inline">Start New Conversation</span>
            <span className="lg:hidden">New Chat</span>
          </button>
        </div>

        {/* 3. SIDEBAR HEADER (DESKTOP) */}
        <div className="hidden border-b border-slate-200 px-5 py-5 dark:border-white/[0.06] lg:block order-1 lg:order-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Chats
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-500">
                Continue your previous conversations
              </p>
            </div>
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={onClearAllChats}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 4. RECENT CHATS TITLE (MOBILE) */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden order-3 lg:order-none">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Chats
          </h3>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={onClearAllChats}
              className="text-xs font-medium text-slate-500 transition hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              Clear
            </button>
          )}
        </div>

      {/* 5. CHAT LIST */}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 lg:p-3 order-4 lg:order-none pb-2">
        {loadingSessions ? (
          <div className="px-3 py-6">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Loading conversations...
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500 dark:bg-[#151923] dark:text-slate-400">
              AI
            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-500">
              No conversations yet
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {[...sessions].sort((a, b) => {
              const aPinned = pinnedChats.includes(a._id);
              const bPinned = pinnedChats.includes(b._id);
              if (aPinned && !bPinned) return -1;
              if (!aPinned && bPinned) return 1;
              return 0;
            }).map((session) => {
              const isSelected =
                selectedSession?._id === session._id;

              const isRenaming =
                editingTitleId === session._id;

              return (
                <div
                  key={session._id}
                  className={`group relative overflow-visible rounded-xl transition ${
                    isSelected
                      ? "bg-slate-100 dark:bg-blue-500/[0.12] dark:ring-1 dark:ring-blue-500/20"
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {isRenaming ? (
                    <div className="p-2">
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            onRenameSession(session);
                          }

                          if (event.key === "Escape") {
                            setEditingTitleId(null);
                            setEditingTitle("");
                          }
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/[0.1] dark:bg-[#171b25] dark:text-white"
                      />

                      <div className="mt-2 flex gap-3 px-1">
                        <button
                          type="button"
                          onClick={() =>
                            onRenameSession(session)
                          }
                          className="text-xs font-medium text-blue-600 dark:text-blue-400"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingTitleId(null);
                            setEditingTitle("");
                          }}
                          className="text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectSession(session)
                        }
                        className="min-w-0 flex-1 px-3 py-3.5 text-left"
                      >
                        <p
                          className={`flex items-center gap-2 truncate text-sm font-medium ${
                            isSelected
                              ? "text-slate-900 dark:text-blue-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="truncate">{session.title || "Untitled Chat"}</span>
                          {pinnedChats.includes(session._id) && (
                            <PinIcon className="h-3 w-3 shrink-0 text-slate-400" />
                          )}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setOpenMenuId(
                            openMenuId === session._id
                              ? null
                              : session._id,
                          );
                        }}
                        className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 lg:opacity-0 transition hover:bg-slate-200 hover:text-slate-900 group-hover:opacity-100 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        title="Chat options"
                      >
                        <MoreIcon />
                      </button>

                      {/* MENU */}

                      {openMenuId === session._id && (
                        <div className="absolute right-2 top-11 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/[0.08] dark:bg-[#171b25]">
                          <button
                            type="button"
                            onClick={() => {
                              if (pinnedChats.includes(session._id)) {
                                setPinnedChats(pinnedChats.filter(id => id !== session._id));
                              } else {
                                setPinnedChats([...pinnedChats, session._id]);
                              }
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                          >
                            <PinIcon className="h-4 w-4" />
                            {pinnedChats.includes(session._id) ? "Unpin" : "Pin"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingTitleId(
                                session._id,
                              );

                              setEditingTitle(
                                session.title ||
                                  "Untitled Chat",
                              );

                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                          >
                            <EditIcon />
                            Rename
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onDeleteSession(
                                session._id,
                              )
                            }
                            disabled={
                              deletingSessionId ===
                              session._id
                            }
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <TrashIcon />

                            {deletingSessionId ===
                            session._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. SIDEBAR FOOTER (DESKTOP) */}

      <div className="hidden border-t border-slate-200 px-5 py-4 dark:border-white/[0.06] lg:block order-5 lg:order-none">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          CampusGPT • AI Academic Assistant
        </p>
      </div>

      {/* 7. BOTTOM FIXED SECTION (MOBILE) */}
      <div className="border-t border-slate-200 p-2 dark:border-white/[0.06] lg:hidden order-6 lg:order-none">
        <nav className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
                  navigate(item.path);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-100 text-slate-900 dark:bg-white/[0.08] dark:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
                }`}
              >
                <span className="text-slate-500 dark:text-slate-400">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <span className="text-red-500 dark:text-red-400"><LogOutIcon /></span>
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </aside>
    </>
  );
}

export default ChatSidebar;