import NepaliDate from "nepali-date-converter";

export const nepaliMonthOptions = [
  { value: 1, label: "बैशाख" },
  { value: 2, label: "जेष्ठ" },
  { value: 3, label: "आषाढ" },
  { value: 4, label: "श्रावण" },
  { value: 5, label: "भाद्र" },
  { value: 6, label: "आश्विन" },
  { value: 7, label: "कार्तिक" },
  { value: 8, label: "मंसिर" },
  { value: 9, label: "पौष" },
  { value: 10, label: "माघ" },
  { value: 11, label: "फाल्गुन" },
  { value: 12, label: "चैत्र" },
];

export const formatDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().split("T")[0];
};

export const getTodayBS = () => {
  const todayBS = new NepaliDate();
  return `${todayBS.getYear()}-${String(todayBS.getMonth() + 1).padStart(2, "0")}-${String(todayBS.getDate()).padStart(2, "0")}`;
};

export const getCurrentBSYearMonth = () => {
  const nowBS = new NepaliDate();
  return {
    year: nowBS.getYear(),
    month: nowBS.getMonth() + 1,
  };
};

export const getBsYears = (pastYears = 5, futureYears = 1) => {
  const currentYear = new NepaliDate().getYear();
  const years = [];
  for (
    let year = currentYear - pastYears;
    year <= currentYear + futureYears;
    year += 1
  ) {
    years.push(year);
  }
  return years;
};

export const getDaysInBsMonth = (year, month) => {
  const monthIndex = month - 1;
  const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonthFirst = new NepaliDate(nextYear, nextMonthIndex, 1);
  return new NepaliDate(year, monthIndex, nextMonthFirst.getDate() - 1).getDate();
};

export const formatDateLabel = (value) => {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
};

export const bsToAdDateLabel = (bsDate) => {
  if (!bsDate) return "-";
  try {
    const [year, month, day] = bsDate.split("-").map(Number);
    const adDate = new NepaliDate(year, month - 1, day).toJsDate();
    return adDate.toLocaleDateString();
  } catch {
    return "-";
  }
};

export const formatTime = (value) => {
  if (!value) return "-";
  if (typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.slice(0, 5);
  }
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const escapeCsv = (value) => {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};
