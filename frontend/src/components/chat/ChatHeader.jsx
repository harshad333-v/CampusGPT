import {
  PlusIcon,
  SunIcon,
  MoonIcon,
} from "./ChatIcons";

function ChatHeader({
  darkMode,
  setDarkMode,
  onCreateChat,
  onOpenMobileMenu,
}) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white dark:border-white/[0.06] dark:bg-[#0d1017] sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 lg:px-8 lg:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden dark:border-white/[0.08] dark:bg-[#151923] dark:text-slate-300 dark:hover:bg-[#1b2030]"
          >
            ☰
          </button>
          
          <div>
            <p className="hidden text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 lg:block">
              Student Portal
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white lg:mt-1 lg:text-2xl">
              CampusGPT
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 lg:h-11 lg:w-11 dark:border-white/[0.08] dark:bg-[#151923] dark:text-slate-300 dark:hover:bg-[#1b2030]"
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
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] lg:h-11 lg:px-4 dark:bg-blue-600 dark:shadow-blue-900/20 dark:hover:bg-blue-500"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;