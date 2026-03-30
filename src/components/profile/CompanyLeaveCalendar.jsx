import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NepaliDate from "nepali-date-converter";

const NEPALI_MONTHS = [
  "बैशाख",
  "जेष्ठ",
  "आषाढ",
  "श्रावण",
  "भाद्र",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पौष",
  "माघ",
  "फाल्गुन",
  "चैत्र",
];

const DAY_HEADERS = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];

const CompanyLeaveCalendar = ({ holidays = [], isMinimal = false }) => {
  const todayBs = useMemo(() => new NepaliDate(), []);
  const [viewYear, setViewYear] = useState(todayBs.getYear());
  const [viewMonth, setViewMonth] = useState(todayBs.getMonth());

  const currentMonthCalendar = useMemo(() => {
    const year = viewYear;
    const month = viewMonth;

    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonthFirst = new NepaliDate(nextYear, nextMonth, 1);
    const daysInMonth = new NepaliDate(
      year,
      month,
      nextMonthFirst.getDate() - 1,
    ).getDate();

    const firstDay = new NepaliDate(year, month, 1).toJsDate().getDay();
    const days = [];

    for (let i = 0; i < firstDay; i += 1) {
      days.push({ day: null, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push({ day, isCurrentMonth: true });
    }

    return { year, month, days };
  }, [viewYear, viewMonth]);

  const parsedHolidays = useMemo(() => {
    const rows = [];

    holidays.forEach((holiday) => {
      try {
        const bsRaw = holiday?.date_bs;
        const adRaw = holiday?.date_ad;
        let bsDate;

        if (typeof bsRaw === "string" && bsRaw) {
          const [year, month, day] = bsRaw.split("-").map(Number);
          bsDate = new NepaliDate(year, month - 1, day);
        } else if (adRaw) {
          const [year, month, day] = String(adRaw).split("-").map(Number);
          bsDate = new NepaliDate(new Date(year, month - 1, day));
        }

        if (!bsDate) {
          return;
        }

        rows.push({
          year: bsDate.getYear(),
          month: bsDate.getMonth(),
          day: bsDate.getDate(),
          title: holiday?.title || "Holiday",
          holidayType: holiday?.holiday_type || "holiday",
        });
      } catch {
        // Ignore malformed holiday rows.
      }
    });

    return rows.sort((a, b) => a.day - b.day);
  }, [holidays]);

  const holidayMap = useMemo(() => {
    const map = new Map();

    parsedHolidays.forEach((holiday) => {
      const key = `${holiday.year}-${holiday.month}-${holiday.day}`;
      map.set(key, holiday);
    });

    return map;
  }, [parsedHolidays]);

  const holidaysInCurrentMonth = useMemo(
    () =>
      parsedHolidays.filter(
        (holiday) =>
          holiday.year === currentMonthCalendar.year &&
          holiday.month === currentMonthCalendar.month,
      ),
    [parsedHolidays, currentMonthCalendar.year, currentMonthCalendar.month],
  );

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
      return;
    }
    setViewMonth((prev) => prev - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
      return;
    }
    setViewMonth((prev) => prev + 1);
  };

  return (
    <div
      className={
        isMinimal
          ? ""
          : "bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
      }
    >
      {!isMinimal && (
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Company Leave Calendar
        </h2>
      )}

      <div
        className={
          isMinimal
            ? "bg-white rounded-xl p-3 border border-slate-200"
            : "bg-slate-50 rounded-xl p-4 border border-slate-200"
        }
      >
        <div
          className={`flex items-center justify-between ${isMinimal ? "mb-3" : "mb-4"}`}
        >
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <p
            className={`${isMinimal ? "text-xs" : "text-sm"} font-semibold text-slate-700`}
          >
            {NEPALI_MONTHS[currentMonthCalendar.month]}{" "}
            {currentMonthCalendar.year}
          </p>

          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-600 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {currentMonthCalendar.days.map((item, index) => {
            const key = `${currentMonthCalendar.year}-${currentMonthCalendar.month}-${item.day}`;
            const dayHoliday = item.day ? holidayMap.get(key) : null;
            const isHoliday = Boolean(dayHoliday);
            const today = new NepaliDate();
            const isToday =
              today.getYear() === currentMonthCalendar.year &&
              today.getMonth() === currentMonthCalendar.month &&
              today.getDate() === item.day;

            return (
              <div
                key={`${item.day ?? "blank"}-${index}`}
                className={`${isMinimal ? "p-1 text-xs" : "p-2 text-sm"} text-center rounded-lg relative transition-shadow hover:shadow-md ${!item.isCurrentMonth ? "opacity-30" : ""} ${
                  isHoliday
                    ? "bg-amber-50 border border-amber-300"
                    : isToday
                      ? "bg-blue-100 border border-blue-300"
                      : "bg-white border border-slate-200 hover:border-slate-300"
                }`}
                title={isHoliday && dayHoliday?.title ? dayHoliday.title : ""}
              >
                <div
                  className={`font-semibold ${
                    isHoliday
                      ? "text-amber-600"
                      : isToday
                        ? "text-blue-700"
                        : "text-slate-700"
                  }`}
                >
                  {item.day}
                </div>

                {isHoliday && dayHoliday?.title && !isMinimal && (
                  <div className="text-xs text-amber-600 font-medium leading-tight break-words px-0.5 mt-0.5">
                    {dayHoliday.title.substring(0, 12)}
                    {dayHoliday.title.length > 12 ? "..." : ""}
                  </div>
                )}

                {isHoliday && (isMinimal || !dayHoliday?.title) && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <div className="w-1 h-1 bg-amber-500 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isMinimal && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
              <span className="text-slate-600">आज (Today)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-amber-50 border border-amber-300 rounded" />
              <span className="text-slate-600">
                कम्पनी छुट्टी (Company Holiday/Leave)
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            {isMinimal ? "Holidays" : "Holidays in this month"}
          </h3>

          {holidaysInCurrentMonth.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {holidaysInCurrentMonth.map((holiday, index) => (
                <div
                  key={`${holiday.year}-${holiday.month}-${holiday.day}-${index}`}
                  className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                >
                  <div className="font-medium text-slate-700 truncate pr-2">
                    {holiday.title}
                  </div>
                  <div className="text-slate-500 whitespace-nowrap">
                    {holiday.day} {NEPALI_MONTHS[holiday.month]}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No holidays in this month</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyLeaveCalendar;
