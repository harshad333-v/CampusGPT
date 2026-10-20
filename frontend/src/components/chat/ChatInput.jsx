import {
  MicrophoneIcon,
  SendIcon,
} from "./ChatIcons";

function ChatInput({
  input,
  setInput,
  sending,
  isListening,
  textareaRef,
  onSubmit,
  onKeyDown,
  onVoiceInput,
}) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 dark:border-white/[0.06] dark:bg-[#0d1017] sm:px-6 lg:px-10">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-5xl"
      >
        {/* LISTENING */}

        {isListening && (
          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-medium text-red-600 dark:text-red-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />

              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>

            Listening... Speak now
          </div>
        )}

        <div
          className={`flex items-end gap-2 rounded-2xl border p-2 shadow-sm transition ${
            isListening
              ? "border-red-400 bg-red-50 ring-2 ring-red-400/20 dark:bg-red-500/[0.05]"
              : "border-slate-300 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 dark:border-white/[0.08] dark:bg-[#151923] dark:focus-within:border-blue-500 dark:focus-within:bg-[#171b25]"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={onKeyDown}
            placeholder={
              isListening
                ? "Listening..."
                : "Message CampusGPT..."
            }
            disabled={sending}
            rows="1"
            className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-white dark:placeholder:text-slate-500"
          />

          {/* VOICE */}

          <button
            type="button"
            onClick={onVoiceInput}
            disabled={sending}
            title={
              isListening
                ? "Stop listening"
                : "Use voice input"
            }
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
              isListening
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isListening && (
              <span className="absolute inset-0 animate-ping rounded-xl bg-red-400 opacity-20" />
            )}

            <MicrophoneIcon className="relative h-5 w-5" />
          </button>

          {/* SEND */}

          <button
            type="submit"
            disabled={
              sending ||
              !input.trim()
            }
            title="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 px-2 text-xs text-slate-400 dark:text-slate-600">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </div>
  );
}

export default ChatInput;