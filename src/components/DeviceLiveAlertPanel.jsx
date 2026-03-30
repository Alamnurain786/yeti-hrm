import { useEffect, useRef, useState } from "react";
import { BellRing, Wifi, WifiOff } from "lucide-react";
import { deviceAPI } from "../services/backendApi";

const MAX_ALERTS = 30;
const RECONNECT_DELAY_MS = 3000;

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const DeviceLiveAlertPanel = ({ deviceNameById = {} }) => {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastConnectedAt, setLastConnectedAt] = useState(null);
  const [autoStartSummary, setAutoStartSummary] = useState(null);

  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const closedByUserRef = useRef(false);

  const hasAlerts = alerts.length > 0;

  const connect = () => {
    if (closedByUserRef.current) return;

    const streamUrl = deviceAPI.getLiveEventsStreamUrl();
    const source = new EventSource(streamUrl);
    eventSourceRef.current = source;

    source.onopen = () => {
      setIsConnected(true);
      setLastConnectedAt(new Date().toISOString());
    };

    source.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!payload) {
        return;
      }

      if (payload.type === "connected") {
        const summary = payload.auto_started;
        if (summary && typeof summary === "object") {
          setAutoStartSummary({
            eligible: Number(summary.eligible || 0),
            started: Number(summary.started || 0),
            alreadyRunning: Number(summary.already_running || 0),
          });
        }
        return;
      }

      if (payload.type !== "attendance_event") {
        return;
      }

      setAlerts((prev) => {
        const next = [payload, ...prev];
        return next.slice(0, MAX_ALERTS);
      });
    };

    source.onerror = () => {
      setIsConnected(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (!closedByUserRef.current) {
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, RECONNECT_DELAY_MS);
      }
    };
  };

  useEffect(() => {
    closedByUserRef.current = false;
    connect();

    return () => {
      closedByUserRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <BellRing size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Live Device Alerts
            </h2>
            <p className="text-xs text-slate-500">
              Real-time punches from active live-sync workers.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isConnected ? "Live stream connected" : "Reconnecting live stream"}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            Last connected: {formatDateTime(lastConnectedAt)}
          </p>
          {autoStartSummary && (
            <p
              className={`text-[11px] mt-1 ${
                autoStartSummary.started > 0
                  ? "text-emerald-600 font-medium"
                  : "text-slate-500"
              }`}
            >
              Auto-started {autoStartSummary.started} devices
              {autoStartSummary.eligible > 0
                ? ` (eligible: ${autoStartSummary.eligible}, already running: ${autoStartSummary.alreadyRunning})`
                : ""}
            </p>
          )}
        </div>
      </div>

      {hasAlerts ? (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">
                  Time
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">
                  Device
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">
                  User
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">
                  Event
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">
                  Method
                </th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item, idx) => {
                const deviceLabel =
                  deviceNameById[item.device_id] || item.device_id || "-";
                const userLabel = item.user_name || item.user_id || "-";
                return (
                  <tr
                    key={`${item.device_id || "dev"}-${item.user_id || "user"}-${item.captured_at || idx}-${idx}`}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-slate-600 text-xs whitespace-nowrap">
                      {formatDateTime(item.captured_at)}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      <span className="font-medium">{deviceLabel}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-700">{userLabel}</td>
                    <td className="py-2 px-3 text-slate-700">
                      {item.event_type_label || "Unknown"}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                        {item.verify_type_label || "Unknown"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-slate-500">
          Waiting for new events from live-sync devices.
        </div>
      )}
    </section>
  );
};

export default DeviceLiveAlertPanel;
