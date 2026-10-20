import {
  CopyIcon,
  CheckIcon,
  EditIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "./ChatIcons";

function ChatMessages({
  messages,
  loadingMessages,
  sending,
  editingMessageId,
  editingMessage,
  setEditingMessage,
  copiedMessageId,
  messageFeedback,
  onCopyMessage,
  onStartEditMessage,
  onCancelEditMessage,
  onSaveEditMessage,
  onMessageFeedback,
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {loadingMessages ? (
        <div className="flex justify-center py-24">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            Loading conversation...
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white shadow-lg dark:bg-blue-600 dark:shadow-blue-900/30">
            AI
          </div>

          <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
            Start a conversation
          </h3>

          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Ask CampusGPT anything related to your studies,
            courses, assignments, or academic work.
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const isUser = message.role === "user";

          const isEditing = editingMessageId === message._id;

          const feedback = messageFeedback[message._id];

          return (
            <div
              key={message._id}
              className={`flex ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[90%] sm:max-w-[82%] lg:max-w-[75%]">

                {/* MESSAGE */}

                <div
                  className={`rounded-2xl px-5 py-4 shadow-sm ${
                    isUser
                      ? "rounded-br-md bg-slate-900 text-white dark:bg-blue-600 dark:shadow-blue-950/30"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-white/[0.07] dark:bg-[#121620] dark:text-slate-200"
                  }`}
                >
                  {/* MESSAGE HEADER */}

                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isUser
                          ? "text-slate-300"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isUser ? "You" : "CampusGPT"}
                    </span>

                    {message.edited && (
                      <span className="text-xs text-slate-400">
                        Edited
                      </span>
                    )}
                  </div>

                  {/* EDIT MODE */}

                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        autoFocus
                        value={editingMessage}
                        onChange={(event) =>
                          setEditingMessage(event.target.value)
                        }
                        rows="3"
                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/[0.1] dark:bg-[#0d1017] dark:text-white"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={onCancelEditMessage}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onSaveEditMessage(message._id)
                          }
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-sm leading-7">
                      {message.message}
                    </p>
                  )}
                </div>

                {/* MESSAGE ACTIONS */}

                {!isEditing && (
                  <div
                    className={`mt-2 flex gap-1 px-1 ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {/* COPY */}

                    <button
                      type="button"
                      onClick={() =>
                        onCopyMessage(message)
                      }
                      title="Copy message"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    >
                      {copiedMessageId === message._id ? (
                        <CheckIcon />
                      ) : (
                        <CopyIcon />
                      )}
                    </button>

                    {/* EDIT USER MESSAGE */}

                    {isUser && (
                      <button
                        type="button"
                        onClick={() =>
                          onStartEditMessage(message)
                        }
                        title="Edit message"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                      >
                        <EditIcon />
                      </button>
                    )}

                    {/* AI FEEDBACK */}

                    {!isUser && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onMessageFeedback(
                              message._id,
                              "up"
                            )
                          }
                          title="Good response"
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            feedback === "up"
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                          }`}
                        >
                          <ThumbsUpIcon />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onMessageFeedback(
                              message._id,
                              "down"
                            )
                          }
                          title="Poor response"
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            feedback === "down"
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                          }`}
                        >
                          <ThumbsDownIcon />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* THINKING */}

      {sending && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/[0.07] dark:bg-[#121620]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />

                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />

                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                CampusGPT is thinking...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatMessages;