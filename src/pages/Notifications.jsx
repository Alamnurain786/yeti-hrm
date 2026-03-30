import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  User,
  Briefcase,
  Settings,
} from "lucide-react";
import { notificationAPI } from "../services/backendApi";
import { useToast } from "../context/ToastContext";

const REFRESH_INTERVAL_MS = 30_000;
const SSE_RECONNECT_MS = 3000;

const formatTimestamp = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
};

const TYPE_FILTERS = [
  { key: "all", label: "All", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
  { key: "leave", label: "Leave", icon: Briefcase },
  { key: "system", label: "System", icon: Settings },
];

const getFilterKey = (type) => {
  const t = String(type || "").toLowerCase();
  if (t.includes("profile") || t.includes("verification")) return "profile";
  if (t.includes("leave")) return "leave";
  return "system";
};

const TYPE_ICON_MAP = {
  profile: { icon: User, bg: "bg-blue-100", color: "text-blue-600" },
  leave: { icon: Briefcase, bg: "bg-emerald-100", color: "text-emerald-600" },
  system: { icon: Settings, bg: "bg-slate-100", color: "text-slate-600" },
};

const Notifications = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const isFirstLoad = useRef(true);
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const closeStreamRef = useRef(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter(
      (item) => getFilterKey(item.type) === activeFilter,
    );
  }, [notifications, activeFilter]);

  const filteredUnread = useMemo(
    () => filtered.filter((item) => !item.is_read).length,
    [filtered],
  );

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const rows = await notificationAPI.getMy();
        setNotifications(rows);
      } catch {
        if (!silent)
          showToast("error", "Failed to load notifications", {
            title: "Load Failed",
          });
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showToast],
  );

  // Initial load + auto-refresh every 30 s
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadNotifications(false);
    }

    const connectStream = () => {
      if (closeStreamRef.current) return;
      const source = new EventSource(notificationAPI.getStreamUrl());
      eventSourceRef.current = source;
      source.onmessage = (event) => {
        let payload = null;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!payload || payload.type !== "notification") return;
        setNotifications((prev) => {
          const exists = prev.some((item) => item.id === payload.id);
          if (exists) return prev;
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
      };
      source.onerror = () => {
        source.close();
        eventSourceRef.current = null;
        if (!closeStreamRef.current) {
          reconnectTimerRef.current = setTimeout(
            connectStream,
            SSE_RECONNECT_MS,
          );
        }
      };
    };

    connectStream();

    const timer = setInterval(
      () => loadNotifications(true),
      REFRESH_INTERVAL_MS,
    );
    return () => {
      closeStreamRef.current = true;
      clearInterval(timer);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );
    } catch {
      showToast("error", "Failed to mark notification as read", {
        title: "Update Failed",
      });
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true })),
      );
      showToast("success", "All notifications marked as read", {
        title: "Updated",
      });
    } catch {
      showToast("error", "Failed to update notifications", {
        title: "Update Failed",
      });
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 mt-1">
            Track profile and leave updates in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/30 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          <CheckCheck size={16} />
          Mark All Read
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(({ key, label, icon: Icon }) => {
          const count =
            key === "all"
              ? unreadCount
              : notifications.filter(
                  (n) => !n.is_read && getFilterKey(n.type) === key,
                ).length;
          const active = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all border ${
                active
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              <Icon size={15} />
              {label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {activeFilter === "all"
              ? `${unreadCount} unread`
              : `${filteredUnread} unread · ${filtered.length} total in this category`}
          </p>
          <p className="text-xs text-slate-400">Auto-refreshes every 30 s</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Bell className="mx-auto mb-3 text-slate-300" size={36} />
            {activeFilter === "all"
              ? "No notifications yet."
              : `No ${activeFilter} notifications.`}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const fk = getFilterKey(item.type);
              const meta = TYPE_ICON_MAP[fk] || TYPE_ICON_MAP.system;
              const TypeIcon = meta.icon;
              return (
                <li
                  key={item.id}
                  className={`px-6 py-4 transition-colors ${
                    item.is_read ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* type icon */}
                    <div
                      className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg}`}
                    >
                      <TypeIcon size={17} className={meta.color} />
                    </div>

                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              item.is_read ? "text-slate-700" : "text-slate-900"
                            }`}
                          >
                            {item.title}
                            {!item.is_read && (
                              <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-500 align-middle" />
                            )}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-600 leading-snug">
                            {item.message}
                          </p>
                          <p className="mt-2 text-xs text-slate-400 inline-flex items-center gap-1">
                            <Clock size={11} />
                            {formatTimestamp(item.created_at)}
                          </p>
                        </div>

                        {!item.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(item.id)}
                            className="flex-shrink-0 rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
