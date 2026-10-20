import {
  PlusIcon,
  SunIcon,
  MoonIcon,
} from "./ChatIcons";

function ChatHeader({
  darkMode,
  setDarkMode,
  onCreateChat,
}) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white dark:border-white/[0.06] dark:bg-[#0d1017]">
      <div className="flex items-center justify-between px-5 py-4 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            TEACHER PORTAL
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            CampusGPT
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* DARK MODE */}

          <button
            type="button"
            onClick={() =>
              setDarkMode((previous) => !previous)
            }
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-white/[0.08] dark:bg-[#151923] dark:text-slate-300 dark:hover:bg-[#1b2030]"
          >
            {darkMode ? (
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
          </button>

          {/* NEW CHAT */}

          <button
            type="button"
            onClick={onCreateChat}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] dark:bg-blue-600 dark:shadow-blue-900/20 dark:hover:bg-blue-500"
          >
            <PlusIcon className="h-4 w-4" />

            New Chat
          </button>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;