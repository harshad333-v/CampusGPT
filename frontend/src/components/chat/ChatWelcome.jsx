import { PlusIcon } from "./ChatIcons";

function ChatWelcome({ onCreateChat }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-xl font-semibold text-white shadow-xl dark:bg-blue-600 dark:shadow-blue-950/30">
          AI
        </div>

        <h2 className="mt-7 text-2xl font-semibold text-slate-900 dark:text-white">
          Welcome to CampusGPT
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
          Your AI-powered academic assistant. Start a new conversation
          or select a previous chat.
        </p>

        <button
          type="button"
          onClick={onCreateChat}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <PlusIcon className="h-4 w-4" />

          Start New Chat
        </button>
      </div>
    </div>
  );
}

export default ChatWelcome;