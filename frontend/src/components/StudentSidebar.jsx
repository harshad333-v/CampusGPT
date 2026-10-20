import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/useTheme";

function StudentSidebar({ hideOnMobile = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      path: "/student",
      icon: "🏠",
    },
    {
      label: "Chat",
      path: "/chat",
       icon: "🤖",
    },
    {
      label: "Documents",
      path: "/documents",
       icon: "📚",
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: "🔔",
    },
    {
      label: "Profile",
      path: "/profile",
      icon: "👤",
    },
    {
      label: "Settings",
      path: "/settings",
      icon: "⚙️",
    },
  ];

  function getButtonClass(path) {
    const isActive = location.pathname === path;

    return isActive
      ? "flex w-full items-center gap-3 rounded-lg bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm"
      : "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white";
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    closeMobileMenu();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}
      {!hideOnMobile && (
        <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 lg:hidden">
        <div className="flex items-center">
          <div className="ml-2">
            <h1 className="text-base font-semibold text-white">
              CampusGPT
            </h1>
            <p className="text-[11px] text-slate-400">
              Academic Intelligence
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-xl text-slate-300 transition hover:bg-slate-800"
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </header>
      )}

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {!hideOnMobile && isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-slate-900 px-6 py-8 text-white transition-transform duration-300 lg:z-40 lg:translate-x-0 ${
          hideOnMobile 
            ? "hidden lg:flex" 
            : isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Mobile close */}
        <button
          type="button"
          onClick={closeMobileMenu}
          aria-label="Close menu"
          className="absolute right-4 top-6 flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
        >
          ×
        </button>

        {/* Logo */}
        <div className="mt-2 lg:mt-0">
          <h1 className="text-2xl font-semibold">
            CampusGPT
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Academic Intelligence
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                closeMobileMenu();
                navigate(item.path);
              }}
              className={getButtonClass(item.path)}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-3 pt-6">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => {
              toggleTheme();
            }}
            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span>Appearance</span>
            <span className="text-xs text-slate-400">
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-white/10 hover:text-red-300"
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default StudentSidebar;