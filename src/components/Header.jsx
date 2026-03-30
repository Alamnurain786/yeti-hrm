import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  User,
  Briefcase,
  Settings,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  companyAPI,
  notificationAPI,
  profileFileAPI,
} from "../services/backendApi";

const getNotifIconMeta = (type) => {
  const t = String(type || "").toLowerCase();
  if (t.includes("profile") || t.includes("verification"))
    return { icon: User, bg: "bg-blue-100", color: "text-blue-600" };
  if (t.includes("leave"))
    return { icon: Briefcase, bg: "bg-emerald-100", color: "text-emerald-600" };
  return { icon: Settings, bg: "bg-slate-100", color: "text-slate-600" };
};

const fmtTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
};

const Header = ({ onMenuToggle = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [openBell, setOpenBell] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [companyLogoSrc, setCompanyLogoSrc] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [logoRefreshTick, setLogoRefreshTick] = useState(0);
  const menuRef = useRef(null);
  const bellRef = useRef(null);
  const avatarObjectUrlRef = useRef(null);
  const companyLogoObjectUrlRef = useRef(null);

  const unreadNotifs = notifications.filter((n) => !n.is_read);
  const unreadCount = unreadNotifs.length;

  const displayName = user?.name || "User";
  const position = user?.position || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpenBell(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load notifications (for count + dropdown)
  useEffect(() => {
    let cancelled = false;
    let eventSource = null;

    const load = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }
      try {
        const rows = await notificationAPI.getMy();
        if (!cancelled) setNotifications(rows);
      } catch {
        if (!cancelled) setNotifications([]);
      }
    };

    load();
    try {
      eventSource = new EventSource(notificationAPI.getStreamUrl());
      eventSource.onmessage = (event) => {
        let payload = null;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!payload || payload.type !== "notification") return;
        if (!cancelled) {
          setNotifications((prev) => {
            if (prev.some((item) => item.id === payload.id)) return prev;
            return [
              {
                id: payload.id,
                type: payload.notification_type,
                title: payload.title,
                message: payload.message,
                is_read: Boolean(payload.is_read),
                created_at: payload.created_at,
              },
              ...prev,
            ];
          });
        }
      };
    } catch {
      eventSource = null;
    }

    const timer = setInterval(load, 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [user]);

  // Resolve avatar from profile files
  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
    };

    const resolve = async () => {
      cleanup();
      if (!user?.id) {
        setAvatarSrc(null);
        return;
      }

      const raw = user?.profileImage || user?.profile_image;
      if (raw && /^(data:|https?:\/\/|\/)/i.test(raw)) {
        setAvatarSrc(raw);
        return;
      }

      if (raw) {
        try {
          const url = await profileFileAPI.createObjectUrl(raw);
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          avatarObjectUrlRef.current = url;
          setAvatarSrc(url);
          return;
        } catch {
          /* fall through */
        }
      }

      try {
        const files = await profileFileAPI.list(user.id);
        const img = files.find((f) => f.field_name === "profileImage");
        if (!img?.id) {
          setAvatarSrc(null);
          return;
        }
        const url = await profileFileAPI.createObjectUrl(img.id);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        avatarObjectUrlRef.current = url;
        setAvatarSrc(url);
      } catch {
        setAvatarSrc(null);
      }
    };

    resolve();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [user?.id, user?.profileImage, user?.profile_image]);

  // Resolve company branding for left-side header block.
  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (companyLogoObjectUrlRef.current) {
        URL.revokeObjectURL(companyLogoObjectUrlRef.current);
        companyLogoObjectUrlRef.current = null;
      }
    };

    const resolveCompanyBranding = async () => {
      cleanup();

      if (!user?.tenant_id) {
        setCompanyLogoSrc(null);
        setCompanyName("");
        return;
      }

      try {
        const company = await companyAPI.getMine();
        if (cancelled) return;
        setCompanyName(company?.name || "Company");
      } catch {
        if (!cancelled) setCompanyName("Company");
      }

      try {
        const logoBlob = await companyAPI.fetchFileBlob(user.tenant_id, "logo");
        const logoUrl = URL.createObjectURL(logoBlob);
        if (cancelled) {
          URL.revokeObjectURL(logoUrl);
          return;
        }
        companyLogoObjectUrlRef.current = logoUrl;
        setCompanyLogoSrc(logoUrl);
      } catch {
        if (!cancelled) setCompanyLogoSrc(null);
      }
    };

    resolveCompanyBranding();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [user?.tenant_id, logoRefreshTick]);

  useEffect(() => {
    const handleCompanyLogoUpdated = () => {
      setLogoRefreshTick((prev) => prev + 1);
    };

    window.addEventListener("company-logo-updated", handleCompanyLogoUpdated);
    return () => {
      window.removeEventListener(
        "company-logo-updated",
        handleCompanyLogoUpdated,
      );
    };
  }, []);

  // Mark a single notification as read and go to notifications page
  const handleNotifClick = async (notif) => {
    setOpenBell(false);
    if (!notif.is_read) {
      try {
        await notificationAPI.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        );
      } catch {
        /* best-effort */
      }
    }
    navigate("/notifications");
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 right-0 left-0 md:left-64 z-40 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          aria-label="Open sidebar menu"
        >
          <Menu size={18} />
        </button>

        {user?.tenant_id && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-200 bg-white shrink-0 max-w-[140px] sm:max-w-[220px]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {companyLogoSrc ? (
                <img
                  src={companyLogoSrc}
                  alt={companyName || "Company"}
                  className="w-full h-full object-cover"
                  onError={() => setCompanyLogoSrc(null)}
                />
              ) : (
                <span className="text-[10px] font-semibold text-slate-500">
                  CO
                </span>
              )}
            </div>
            <p className="hidden sm:block text-xs sm:text-sm font-medium text-slate-700 max-w-[160px] truncate">
              {companyName || "Company"}
            </p>
          </div>
        )}

        <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-3 lg:px-4 py-2 w-full max-w-xs lg:max-w-md">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, departments..."
            className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* ── Bell with mini dropdown ── */}
        <div ref={bellRef} className="relative">
          <button
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            onClick={() => setOpenBell((prev) => !prev)}
            title={
              unreadCount > 0
                ? `${unreadCount} unread notification(s)`
                : "No unread notifications"
            }
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] rounded-full border-2 border-white flex items-center justify-center font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 bg-slate-300 rounded-full border-2 border-white" />
            )}
          </button>

          {openBell && (
            <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {/* unread list (max 5) */}
              {unreadNotifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                  <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                  No unread notifications
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {unreadNotifs.slice(0, 5).map((notif) => {
                    const meta = getNotifIconMeta(notif.type);
                    const Icon = meta.icon;
                    return (
                      <li key={notif.id}>
                        <button
                          type="button"
                          onClick={() => handleNotifClick(notif)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50/50 transition-colors text-left"
                        >
                          <span
                            className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg}`}
                          >
                            <Icon size={15} className={meta.color} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-semibold text-slate-800 truncate">
                              {notif.title}
                            </span>
                            <span className="block text-xs text-slate-500 truncate mt-0.5">
                              {notif.message}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-1">
                              {fmtTime(notif.created_at)}
                            </span>
                          </span>
                          <span className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-blue-500" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* footer */}
              <div className="border-t border-slate-100 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenBell(false);
                    navigate("/notifications");
                  }}
                  className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── User menu ── */}
        <div
          ref={menuRef}
          className="relative flex items-center space-x-2 sm:space-x-3 pl-3 sm:pl-6 border-l border-slate-200"
        >
          <button
            onClick={() => setOpenMenu((prev) => !prev)}
            className="flex items-center space-x-3"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-700">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">{position || "-"}</p>
            </div>

            {/* Avatar — flex-shrink-0 prevents the circle from being squished */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 overflow-hidden">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setAvatarSrc(null)}
                />
              ) : (
                <span className="text-sm select-none">{initials || "U"}</span>
              )}
            </div>

            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {openMenu && (
            <div className="absolute right-0 top-14 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg p-3 z-50">
              <div className="px-2 pb-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500">{position || "-"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
