import { useMemo, useState } from "react";
import { BarChart3, Download, FileDown } from "lucide-react";
import NepaliDate from "nepali-date-converter";
import { reportsAPI } from "../services/backendApi";
import { useToast } from "../context/ToastContext";
import { getBsYears, nepaliMonthOptions } from "../utils/nepaliDateUtils";

const getDefaultBsMonth = () => {
  const nowBs = new NepaliDate();
  return {
    year: nowBs.getYear(),
    month: nowBs.getMonth() + 1,
  };
};

const toAdMonthParam = (bsYear, bsMonth) => {
  const adDate = new NepaliDate(bsYear, bsMonth - 1, 1).toJsDate();
  const y = adDate.getFullYear();
  const m = String(adDate.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const Reports = () => {
  const { showToast } = useToast();
  const defaultBs = getDefaultBsMonth();
  const [bsYear, setBsYear] = useState(defaultBs.year);
  const [bsMonth, setBsMonth] = useState(defaultBs.month);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);

  const adMonth = useMemo(
    () => toAdMonthParam(bsYear, bsMonth),
    [bsYear, bsMonth],
  );
  const bsMonthLabel = useMemo(() => {
    const found = nepaliMonthOptions.find((item) => item.value === bsMonth);
    return found?.label || String(bsMonth);
  }, [bsMonth]);
  const bsYearOptions = useMemo(() => getBsYears(5, 2), []);

  const summaryRows = useMemo(() => {
    if (!payload?.summary) return [];
    return Object.entries(payload.summary);
  }, [payload]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await reportsAPI.getMonthlyKpi(adMonth);
      setPayload(result);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvDownload = () => {
    reportsAPI
      .downloadMonthlyKpiCsv(adMonth)
      .then(({ blob, contentDisposition }) => {
        const headerNameMatch =
          /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(
            String(contentDisposition || ""),
          );
        const fallbackName = `monthly-kpi-${adMonth}.csv`;
        const headerFileName = headerNameMatch
          ? decodeURIComponent(
              headerNameMatch[1] || headerNameMatch[2] || fallbackName,
            )
          : fallbackName;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = headerFileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        showToast("error", "Failed to download CSV report", {
          title: "Download Failed",
        });
      });
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const handlePdfDownload = () => {
    if (!payload) {
      showToast("info", "Load report data before PDF export", {
        title: "No Data",
      });
      return;
    }
    const html = `
      <html>
        <head>
          <title>Monthly KPI Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            h1, h2 { margin: 0 0 12px 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h1>Monthly HR KPI Report (BS: ${bsYear}-${String(bsMonth).padStart(2, "0")}, AD Query: ${payload.month})</h1>
          <h2>Summary</h2>
          <table border="1" cellpadding="8" cellspacing="0">
            ${summaryRows
              .map(
                ([k, v]) =>
                  `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`,
              )
              .join("")}
          </table>
          <h2>Department Comparison</h2>
          <table border="1" cellpadding="8" cellspacing="0">
            <tr><th>Department</th><th>Records</th><th>Late</th><th>Absent</th><th>Late Rate</th><th>Absenteeism Rate</th></tr>
            ${(payload.department_comparison || [])
              .map(
                (row) =>
                  `<tr><td>${escapeHtml(row.department)}</td><td>${escapeHtml(row.records)}</td><td>${escapeHtml(row.late)}</td><td>${escapeHtml(row.absent)}</td><td>${escapeHtml(row.late_rate)}</td><td>${escapeHtml(row.absenteeism_rate)}</td></tr>`,
              )
              .join("")}
          </table>
          <h2>Section Comparison</h2>
          <table border="1" cellpadding="8" cellspacing="0">
            <tr><th>Section</th><th>Records</th><th>Late</th><th>Absent</th><th>Late Rate</th><th>Absenteeism Rate</th></tr>
            ${(payload.section_comparison || [])
              .map(
                (row) =>
                  `<tr><td>${escapeHtml(row.section)}</td><td>${escapeHtml(row.records)}</td><td>${escapeHtml(row.late)}</td><td>${escapeHtml(row.absent)}</td><td>${escapeHtml(row.late_rate)}</td><td>${escapeHtml(row.absenteeism_rate)}</td></tr>`,
              )
              .join("")}
          </table>
          <script>
            window.addEventListener('load', function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 100);
            });
          </script>
        </body>
      </html>
    `;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      showToast("error", "Popup blocked. Allow popups to export PDF.", {
        title: "PDF Export Blocked",
      });
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-600" />
            Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Monthly HR KPI dashboard with department and section comparisons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={bsMonth}
            onChange={(e) => setBsMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200"
          >
            {nepaliMonthOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={bsYear}
            onChange={(e) => setBsYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200"
          >
            {bsYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadReport}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Loading..." : "Load"}
          </button>
          <button
            type="button"
            onClick={handleCsvDownload}
            disabled={!payload}
            className="px-3 py-2 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Download size={16} /> CSV
          </button>
          <button
            type="button"
            onClick={handlePdfDownload}
            disabled={!payload}
            className="px-3 py-2 rounded-xl border border-indigo-600 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <FileDown size={16} /> PDF
          </button>
        </div>
      </div>

      {!payload ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-slate-500">
          Load a Nepali month to view KPI report.
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            Viewing BS month {bsMonthLabel} {bsYear} (API month: {payload.month}
            )
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryRows.map(([key, value]) => (
              <div
                key={key}
                className="bg-white rounded-2xl border border-slate-100 p-4"
              >
                <p className="text-xs text-slate-500 uppercase">{key}</p>
                <p className="text-2xl font-semibold text-slate-800 mt-1">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <section className="bg-white rounded-2xl border border-slate-100 p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Department Comparison
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-2">Department</th>
                  <th className="text-left p-2">Records</th>
                  <th className="text-left p-2">Late</th>
                  <th className="text-left p-2">Absent</th>
                  <th className="text-left p-2">Late Rate</th>
                  <th className="text-left p-2">Absenteeism Rate</th>
                </tr>
              </thead>
              <tbody>
                {(payload.department_comparison || []).map((row) => (
                  <tr
                    key={row.department}
                    className="border-t border-slate-100"
                  >
                    <td className="p-2">{row.department}</td>
                    <td className="p-2">{row.records}</td>
                    <td className="p-2">{row.late}</td>
                    <td className="p-2">{row.absent}</td>
                    <td className="p-2">{row.late_rate}%</td>
                    <td className="p-2">{row.absenteeism_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Section Comparison
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-2">Section</th>
                  <th className="text-left p-2">Records</th>
                  <th className="text-left p-2">Late</th>
                  <th className="text-left p-2">Absent</th>
                  <th className="text-left p-2">Late Rate</th>
                  <th className="text-left p-2">Absenteeism Rate</th>
                </tr>
              </thead>
              <tbody>
                {(payload.section_comparison || []).map((row) => (
                  <tr key={row.section} className="border-t border-slate-100">
                    <td className="p-2">{row.section}</td>
                    <td className="p-2">{row.records}</td>
                    <td className="p-2">{row.late}</td>
                    <td className="p-2">{row.absent}</td>
                    <td className="p-2">{row.late_rate}%</td>
                    <td className="p-2">{row.absenteeism_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

export default Reports;
