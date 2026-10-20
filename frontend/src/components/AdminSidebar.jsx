import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "🏠",
    },
    {
      label: "User Management",
      path: "/admin/users",
      icon: "👥",
    },
    {
      label: "Bulk Registration",
      path: "/admin/bulk-registration",
      icon: "📤",
    },
    {
      label: "Departments",
      path: "/admin/departments",
      icon: "🏛️",
    },
    {
      label: "Documents",
      path: "/admin/documents",
      icon: "📚",
    },
    {
      label: "Notifications",
      path: "/admin/notifications",
      icon: "🔔",
    },
    {
      label: "Profile",
      path: "/admin/profile",
      icon: "👤",
    },
    {
      label: "Settings",
      path: "/admin/settings",
      icon: "⚙️",
    },
  ];

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleMobileLogout() {
    closeMobileMenu();
    handleLogout();
  }

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-white/[0.06] dark:bg-[#0d1017] lg:hidden">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-blue-600">
            CG
          </div>

          <div className="ml-3">
            <h1 className="text-base font-semibold text-slate-900 dark:text-white">
              CampusGPT
            </h1>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Admin Portal
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsMobileMenuOpen(
              (previous) => !previous
            )
          }
          aria-label={
            isMobileMenuOpen
              ? "Close menu"
              : "Open menu"
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-700 transition hover:bg-slate-100 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]"
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 dark:border-white/[0.06] dark:bg-[#0d1017] lg:z-40 lg:translate-x-0 lg:shadow-none ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center border-b border-slate-200 px-6 dark:border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-blue-600">
            CG
          </div>

          <div className="ml-3">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              CampusGPT
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin Portal
            </p>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close menu"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Administration
          </p>

          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin/dashboard"}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm dark:bg-blue-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                }`
              }
            >
              <span className="flex w-5 shrink-0 justify-center text-base">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-slate-200 p-4 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={handleMobileLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <span className="flex w-5 shrink-0 justify-center text-base">
              🚪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;