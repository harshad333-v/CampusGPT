import {
  PlusIcon,
  MoreIcon,
  EditIcon,
  TrashIcon,
} from "./ChatIcons";

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
}) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-white/[0.06] dark:bg-[#0d1017] md:flex">

      {/* SIDEBAR HEADER */}
      <div className="border-b border-slate-200 px-5 py-5 dark:border-white/[0.06]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Conversations
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

      {/* NEW CHAT BUTTON */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={onCreateChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/[0.08] dark:bg-[#151923] dark:text-slate-200 dark:hover:bg-[#1b2030]"
        >
          <PlusIcon className="h-4 w-4" />
          Start New Conversation
        </button>
      </div>

      {/* CHAT LIST */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
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
            {sessions.map((session) => {
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
                          className={`truncate text-sm font-medium ${
                            isSelected
                              ? "text-slate-900 dark:text-blue-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {session.title || "Untitled Chat"}
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
                        className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-900 group-hover:opacity-100 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        title="Conversation options"
                      >
                        <MoreIcon />
                      </button>

                      {/* OPTIONS MENU */}
                      {openMenuId === session._id && (
                        <div className="absolute right-2 top-11 z-30 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/[0.08] dark:bg-[#171b25]">

                          <button
                            type="button"
                            onClick={() => {
                              setEditingTitleId(session._id);

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
                              onDeleteSession(session._id)
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

      {/* SIDEBAR FOOTER */}
      <div className="border-t border-slate-200 px-5 py-4 dark:border-white/[0.06]">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          CampusGPT • Teacher AI Assistant
        </p>
      </div>
    </aside>
  );
}

export default ChatSidebar;