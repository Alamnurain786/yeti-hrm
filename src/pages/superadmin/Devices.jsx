import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  deviceAPI,
  getApiErrorMessage,
  getApiValidationErrors,
} from "../../services/backendApi";
import { useToast } from "../../context/ToastContext";
import DeviceLiveAlertPanel from "../../components/DeviceLiveAlertPanel";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const LIVE_STATUS_POLL_MS = 15 * 1000;
const extractSyncStats = (result) => ({
  newCount:
    result?.inserted_events ??
    result?.last_sync_new_event_count ??
    result?.new_attendance_records ??
    result?.records ??
    0,
  skippedCount: result?.skipped_duplicates ?? 0,
  deviceTotal:
    typeof result?.device_total_events === "number"
      ? result.device_total_events
      : typeof result?.last_known_device_event_count === "number"
        ? result.last_known_device_event_count
        : null,
  dbBefore:
    typeof result?.db_events_before === "number"
      ? result.db_events_before
      : null,
  dbAfter:
    typeof result?.db_events_after === "number"
      ? result.db_events_after
      : typeof result?.last_known_db_event_count === "number"
        ? result.last_known_db_event_count
        : null,
});

const getLiveSyncTone = (status) => {
  switch (status?.connection_state) {
    case "running":
      return "bg-emerald-100 text-emerald-700";
    case "connecting":
    case "starting":
    case "stopping":
      return "bg-amber-100 text-amber-700";
    case "reconnecting":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-200 text-slate-600";
  }
};

const formatLiveSyncState = (status) => {
  const value = status?.connection_state || "stopped";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const Devices = () => {
  const { showToast } = useToast();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    port: "",
    location: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  const [detailsByDeviceId, setDetailsByDeviceId] = useState({});
  const [liveSyncStatusByDeviceId, setLiveSyncStatusByDeviceId] = useState({});
  const [syncStatsByDeviceId, setSyncStatsByDeviceId] = useState({});
  const [syncingDeviceIds, setSyncingDeviceIds] = useState({});
  const [liveSyncStoppingByDeviceId, setLiveSyncStoppingByDeviceId] = useState(
    {},
  );

  const updateSyncStats = useCallback((deviceId, stats) => {
    setSyncStatsByDeviceId((prev) => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        ...stats,
      },
    }));
  }, []);

  const updateLiveSyncStatus = useCallback((deviceId, status) => {
    setLiveSyncStatusByDeviceId((prev) => ({
      ...prev,
      [deviceId]: status,
    }));
  }, []);

  const refreshLiveSyncStatus = useCallback(
    async (deviceId) => {
      try {
        const status = await deviceAPI.getLiveSyncStatus(deviceId);
        updateLiveSyncStatus(deviceId, status || null);
      } catch {
        updateLiveSyncStatus(deviceId, null);
      }
    },
    [updateLiveSyncStatus],
  );

  const refreshAllLiveSyncStatuses = useCallback(async (deviceList) => {
    const entries = await Promise.all(
      deviceList.map(async (device) => {
        try {
          const status = await deviceAPI.getLiveSyncStatus(device.id);
          return [device.id, status || null];
        } catch {
          return [device.id, null];
        }
      }),
    );

    setLiveSyncStatusByDeviceId(Object.fromEntries(entries));
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const data = await deviceAPI.getAll();
      setDevices(data);
      const nextSyncStats = Object.fromEntries(
        data.map((device) => [
          device.id,
          {
            deviceTotal: device.last_known_device_event_count,
            dbAfter: device.last_known_db_event_count,
            newCount: device.last_sync_new_event_count ?? 0,
            syncedAt: device.last_sync_at,
          },
        ]),
      );
      setSyncStatsByDeviceId(nextSyncStats);

      const deviceMetaEntries = await Promise.all(
        data.map(async (device) => {
          const [details, liveStatus] = await Promise.all([
            deviceAPI.getDetails(device.id).catch(() => null),
            deviceAPI.getLiveSyncStatus(device.id).catch(() => null),
          ]);
          return [device.id, { details, liveStatus }];
        }),
      );

      const nextDetails = {};
      const nextLiveStatuses = {};
      deviceMetaEntries.forEach(([deviceId, meta]) => {
        nextDetails[deviceId] = meta.details || null;
        nextLiveStatuses[deviceId] = meta.liveStatus || null;
      });

      setDetailsByDeviceId(nextDetails);
      setLiveSyncStatusByDeviceId(nextLiveStatuses);
    } catch {
      showToast("error", "Failed to load devices", { title: "Load Failed" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    if (devices.length === 0) return;

    const timerId = setInterval(() => {
      refreshAllLiveSyncStatuses(devices);
    }, LIVE_STATUS_POLL_MS);

    return () => clearInterval(timerId);
  }, [devices, refreshAllLiveSyncStatuses]);

  const filteredDevices = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return devices.filter((d) =>
      [
        d.name,
        d.ip,
        d.location,
        detailsByDeviceId[d.id]?.device_name,
        detailsByDeviceId[d.id]?.serial_number,
        detailsByDeviceId[d.id]?.mac_address,
        detailsByDeviceId[d.id]?.firmware_version,
      ].some((val) =>
        String(val || "")
          .toLowerCase()
          .includes(search),
      ),
    );
  }, [devices, detailsByDeviceId, searchTerm]);

  const deviceNameById = useMemo(
    () =>
      Object.fromEntries(
        devices.map((device) => [
          device.id,
          detailsByDeviceId[device.id]?.device_name || device.name,
        ]),
      ),
    [devices, detailsByDeviceId],
  );

  // modal helpers
  const openModal = (device = null) => {
    setEditingDevice(device);
    setFormData({
      name: device?.name || "",
      ip: device?.ip || "",
      port: device?.port || "",
      location: device?.location || "",
    });
    setShowModal(true);
    setHasChanges(false);
    setErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDevice(null);
    setSaving(false);
    setFormData({
      name: "",
      ip: "",
      port: "",
      location: "",
    });
    setHasChanges(false);
    setErrors({});
  };

  const closeModalWithGuard = () => {
    if (hasChanges) {
      showToast("info", "You have unsaved changes in this form.", {
        title: "Unsaved Changes",
        duration: 6000,
        actions: [
          {
            label: "Discard",
            variant: "danger",
            onClick: closeModal,
          },
          {
            label: "Keep Editing",
            onClick: () => {},
          },
        ],
      });
      return;
    }
    closeModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasChanges(true);
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.ip || !formData.port) {
      showToast("error", "Name, IP, and Port are required", {
        title: "Validation Error",
      });
      return;
    }
    setSaving(true);
    try {
      if (editingDevice) {
        const updated = await deviceAPI.update(editingDevice.id, {
          name: formData.name,
          ip: formData.ip,
          port: Number(formData.port),
          location: formData.location,
        });
        setDevices((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d)),
        );
        showToast("success", "Device updated successfully", {
          title: "Updated",
        });
      } else {
        const created = await deviceAPI.create({
          name: formData.name,
          ip: formData.ip,
          port: Number(formData.port),
          location: formData.location,
        });
        setDevices((prev) => [...prev, created]);
        showToast("success", "Device added successfully", { title: "Added" });
      }
      closeModal();
    } catch (err) {
      const validationErrors = getApiValidationErrors(err);
      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
      }
      showToast("error", getApiErrorMessage(err, "Save failed"), {
        title: editingDevice ? "Update Failed" : "Add Failed",
      });
    } finally {
      setSaving(false);
    }
  };

  // device actions
  const handleCheckOnline = async (deviceId) => {
    try {
      const result = await deviceAPI.connect(deviceId);
      const online = Boolean(result?.online);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? {
                ...d,
                status: online ? "online" : "offline",
                last_seen_at: online ? new Date().toISOString() : null,
              }
            : d,
        ),
      );
      try {
        const latestDetails = await deviceAPI.getDetails(deviceId);
        setDetailsByDeviceId((prev) => ({
          ...prev,
          [deviceId]: latestDetails || null,
        }));
      } catch {
        // Keep existing cached details if refresh fails.
      }
      showToast(
        online ? "success" : "error",
        online
          ? "Connected and data fetched from device"
          : result?.error || "Device is offline",
        { title: "Device Status" },
      );
      await refreshLiveSyncStatus(deviceId);
    } catch {
      showToast("error", "Could not reach device", { title: "Check Failed" });
    }
  };

  const handleStopLiveSync = async (deviceId) => {
    setLiveSyncStoppingByDeviceId((prev) => ({ ...prev, [deviceId]: true }));
    try {
      const result = await deviceAPI.stopLiveSync(deviceId);
      updateLiveSyncStatus(deviceId, result?.status || null);
      showToast("success", result?.message || "Live sync stopped", {
        title: "Live Sync",
      });
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "Could not stop live sync"), {
        title: "Live Sync",
      });
    } finally {
      setLiveSyncStoppingByDeviceId((prev) => ({ ...prev, [deviceId]: false }));
      await refreshLiveSyncStatus(deviceId);
    }
  };

  const handleSync = async (deviceId) => {
    setSyncingDeviceIds((prev) => ({ ...prev, [deviceId]: true }));
    try {
      const result = await deviceAPI.syncAttendance(deviceId);
      const { newCount, skippedCount, deviceTotal, dbBefore, dbAfter } =
        extractSyncStats(result);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? {
                ...d,
                last_sync_at: new Date().toISOString(),
                last_known_device_event_count: deviceTotal,
                last_known_db_event_count: dbAfter,
                last_sync_new_event_count: newCount,
              }
            : d,
        ),
      );
      updateSyncStats(deviceId, {
        newCount,
        deviceTotal,
        dbBefore,
        dbAfter,
        syncedAt: new Date().toISOString(),
      });
      if (newCount > 0) {
        showToast(
          "success",
          typeof deviceTotal === "number" && typeof dbAfter === "number"
            ? `New: ${newCount}. Device total: ${deviceTotal}. System total: ${dbAfter}.`
            : `Received ${newCount} new transaction(s) from device.`,
          { title: "Recovery Sync Complete" },
        );
      } else {
        showToast(
          "info",
          typeof deviceTotal === "number" && typeof dbBefore === "number"
            ? `No new data. Device total: ${deviceTotal}, System before sync: ${dbBefore}.`
            : skippedCount > 0
              ? "No new attendance data found. Device logs are already up to date."
              : "No new attendance data received from device.",
          { title: "Recovery Sync" },
        );
      }
    } catch (err) {
      const message =
        err?.code === "ECONNABORTED"
          ? "Sync request timed out. Try a date range or sync during low traffic."
          : getApiErrorMessage(err, "Sync failed");
      showToast("error", message, { title: "Recovery Sync Error" });
    } finally {
      setSyncingDeviceIds((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  const handleDelete = async (device) => {
    if (window.confirm(`Delete ${device.name}?`)) {
      try {
        await deviceAPI.delete(device.id);
        setDevices((prev) => prev.filter((d) => d.id !== device.id));
        setLiveSyncStatusByDeviceId((prev) => {
          const next = { ...prev };
          delete next[device.id];
          return next;
        });
        showToast("success", "Device removed", { title: "Deleted" });
      } catch {
        showToast("error", "Could not delete device", {
          title: "Delete Failed",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Devices</h1>
          <p className="text-slate-500 mt-1">
            Manage attendance devices, live sync, and recovery sync.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Live sync starts automatically after connect and when this page
            subscribes to events. Recovery Sync pulls raw logs manually when you
            need to backfill missed data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
          >
            <Plus size={20} className="mr-2" />
            Add Device
          </button>
        </div>
      </div>

      <DeviceLiveAlertPanel deviceNameById={deviceNameById} />

      {/* Device list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-72 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading devices</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            {filteredDevices.length > 0 ? (
              filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  details={detailsByDeviceId[device.id]}
                  onEdit={() => openModal(device)}
                  onDelete={() => handleDelete(device)}
                  onCheckOnline={() => handleCheckOnline(device.id)}
                  onStopLiveSync={() => handleStopLiveSync(device.id)}
                  onSync={() => handleSync(device.id)}
                  isSyncing={Boolean(syncingDeviceIds[device.id])}
                  liveSyncStatus={liveSyncStatusByDeviceId[device.id]}
                  isStoppingLiveSync={Boolean(
                    liveSyncStoppingByDeviceId[device.id],
                  )}
                  syncStats={syncStatsByDeviceId[device.id]}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Server size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No devices found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* â”€â”€ Add/Edit Modal â”€â”€ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingDevice ? "Edit Device" : "Add Device"}
              </h2>
              <button
                onClick={closeModalWithGuard}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Main Gate Scanner"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.name ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    IP Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ip"
                    value={formData.ip}
                    onChange={handleChange}
                    placeholder="10.0.70.2"
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.ip ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                    required
                  />
                  {errors.ip && (
                    <p className="text-red-500 text-xs mt-1">{errors.ip}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Port <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    placeholder="4370"
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.port ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                    required
                  />
                  {errors.port && (
                    <p className="text-red-500 text-xs mt-1">{errors.port}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Head Office â€“ Main Gate"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModalWithGuard}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 font-medium disabled:bg-slate-300 disabled:shadow-none"
                >
                  {saving
                    ? "Savingâ€¦"
                    : editingDevice
                      ? "Update Device"
                      : "Save Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DeviceCard = ({
  device,
  details,
  onEdit,
  onDelete,
  onCheckOnline,
  onStopLiveSync,
  onSync,
  isSyncing,
  liveSyncStatus,
  isStoppingLiveSync,
  syncStats,
}) => {
  const isLiveRunning = Boolean(liveSyncStatus?.running);
  const isStopping = isStoppingLiveSync;

  return (
    <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Server size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {device.name}
            </h3>
            <p className="text-sm text-slate-500 font-mono">
              {device.ip}:{device.port}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-white hover:bg-red-100 text-red-600"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <InfoRow
          label="Device Name"
          value={details?.device_name || device.name}
        />
        <InfoRow label="Serial Number" value={details?.serial_number} mono />
        <InfoRow label="MAC Address" value={details?.mac_address} mono />
        <InfoRow label="Firmware" value={details?.firmware_version} />
        <InfoRow label="Location" value={device.location} />
        <InfoRow label="Device ID" value={device.id} mono />
        <InfoRow label="Last Seen" value={formatDate(device.last_seen_at)} />
        <InfoRow label="Last Sync" value={formatDate(device.last_sync_at)} />
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
            device.status === "online"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {device.status === "online" ? (
            <Wifi size={13} />
          ) : (
            <WifiOff size={13} />
          )}
          {device.status}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getLiveSyncTone(
            liveSyncStatus,
          )}`}
        >
          Live Sync: {formatLiveSyncState(liveSyncStatus)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <CountPill label="Device" value={syncStats?.deviceTotal} />
        <CountPill label="System" value={syncStats?.dbAfter} />
        <CountPill label="New" value={syncStats?.newCount} />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {syncStats?.syncedAt
          ? `Recovery counts updated: ${formatDate(syncStats.syncedAt)}`
          : "Recovery counts will appear after the first manual sync."}
      </p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <InfoRow
          label="Last Live Event"
          value={formatDate(liveSyncStatus?.last_event_at)}
        />
        <InfoRow
          label="Last Heartbeat"
          value={formatDate(liveSyncStatus?.last_heartbeat_at)}
        />
        <InfoRow
          label="Events Received"
          value={liveSyncStatus?.events_received ?? 0}
        />
        <InfoRow
          label="Reconnects"
          value={liveSyncStatus?.reconnect_attempts ?? 0}
        />
        <InfoRow
          label="Backend Worker"
          value={liveSyncStatus?.worker_alive ? "Running" : "Stopped"}
        />
        <InfoRow
          label="Backend PID"
          value={liveSyncStatus?.backend_pid ?? "-"}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500 min-h-4">
        {liveSyncStatus?.last_error ||
          (isLiveRunning
            ? "Live sync is waiting for new punches from the device."
            : "Live sync is stopped. Use Recovery Sync to backfill missed records.")}
      </p>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onCheckOnline}
          className="px-3 py-1.5 rounded-xl text-xs bg-slate-900 text-white hover:bg-slate-800"
        >
          Connect
        </button>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onStopLiveSync}
            disabled={!isLiveRunning || isStopping}
            className="px-3 py-1.5 rounded-xl text-xs bg-amber-500 text-white hover:bg-amber-600 disabled:bg-slate-300"
          >
            {isStopping ? "Stopping..." : "Stop Live"}
          </button>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl text-xs bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 disabled:bg-slate-300"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Recovering..." : "Recovery Sync"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CountPill = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
    <p className="text-[11px] text-slate-400">{label} load</p>
    <p className="text-sm font-semibold text-slate-700">{value ?? "-"}</p>
  </div>
);

const InfoRow = ({ label, value, mono = false }) => (
  <div>
    <p className="text-slate-400">{label}</p>
    <p
      className={`text-slate-700 font-medium truncate ${mono ? "font-mono" : ""}`}
    >
      {value || "-"}
    </p>
  </div>
);

export default Devices;
