import { PlusIcon } from "./ChatIcons";

function ChatWelcome({ onCreateChat }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-10 sm:px-6 lg:px-10">
      <div className="w-full max-w-2xl text-center">

        {/* AI ICON */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-xl font-bold text-white shadow-lg dark:bg-blue-600 dark:shadow-blue-900/30">
          AI
        </div>

        {/* WELCOME TEXT */}
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Welcome to CampusGPT
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
          Your AI assistant for teaching, academic content, course materials,
          lesson planning, and student-related questions.
        </p>

        {/* CREATE CHAT BUTTON */}
        <button
          type="button"
          onClick={onCreateChat}
          className="mx-auto mt-8 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <PlusIcon className="h-4 w-4" />
          Start a New Conversation
        </button>

        {/* SUGGESTIONS */}
        <div className="mt-12 grid gap-3 text-left sm:grid-cols-2">

          {/* SUGGESTION 1 */}
          <button
            type="button"
            onClick={onCreateChat}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/[0.07] dark:bg-[#121620] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/[0.05]"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Create teaching material
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Get help preparing lectures, notes, and learning resources.
            </p>
          </button>

          {/* SUGGESTION 2 */}
          <button
            type="button"
            onClick={onCreateChat}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/[0.07] dark:bg-[#121620] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/[0.05]"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Explain academic topics
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Explore concepts and prepare clear explanations for students.
            </p>
          </button>

          {/* SUGGESTION 3 */}
          <button
            type="button"
            onClick={onCreateChat}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/[0.07] dark:bg-[#121620] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/[0.05]"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Generate academic ideas
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Brainstorm assignments, activities, and classroom discussions.
            </p>
          </button>

          {/* SUGGESTION 4 */}
          <button
            type="button"
            onClick={onCreateChat}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/[0.07] dark:bg-[#121620] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/[0.05]"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Ask CampusGPT
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Start a conversation and ask anything related to teaching or
              academics.
            </p>
          </button>
        </div>

        {/* FOOTER */}
        <p className="mt-10 text-xs text-slate-400 dark:text-slate-600">
          CampusGPT • Your AI assistant for teaching and academic work
        </p>

      </div>
    </div>
  );
}

export default ChatWelcome;