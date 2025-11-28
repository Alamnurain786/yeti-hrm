import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import NepaliDate from "nepali-date-converter";

const NepaliDatePicker = ({ value, onChange, placeholder, className = "" }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [displayValue, setDisplayValue] = useState(value || "");
  const calendarRef = useRef(null);

  // Nepali month names
  const nepaliMonths = [
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

  // Get current Nepali date or parse the value
  const getCurrentNepaliDate = () => {
    if (value) {
      try {
        const [year, month, day] = value.split("-").map(Number);
        return new NepaliDate(year, month - 1, day);
      } catch {
        return new NepaliDate();
      }
    }
    return new NepaliDate();
  };

  const [currentDate, setCurrentDate] = useState(getCurrentNepaliDate());

  // Update display value when prop changes
  useEffect(() => {
    setDisplayValue(value || "");
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  // Get days in current Nepali month
  const getDaysInMonth = (year, month) => {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const lastDay = new NepaliDate(nextYear, nextMonth, 1);
    return new NepaliDate(year, month, lastDay.getDate() - 1).getDate();
  };

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year, month) => {
    return new NepaliDate(year, month, 1).toJsDate().getDay();
  };

  // Generate calendar days
  const generateCalendar = () => {
    const year = currentDate.getYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (day) => {
    const year = currentDate.getYear();
    const month = currentDate.getMonth();
    const selectedDate = new NepaliDate(year, month, day);

    const formattedDate = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    setDisplayValue(formattedDate);
    onChange(formattedDate);
    setShowCalendar(false);
  };

  // Navigate to previous month
  const previousMonth = () => {
    const year = currentDate.getYear();
    const month = currentDate.getMonth();
    if (month === 0) {
      setCurrentDate(new NepaliDate(year - 1, 11, 1));
    } else {
      setCurrentDate(new NepaliDate(year, month - 1, 1));
    }
  };

  // Navigate to next month
  const nextMonth = () => {
    const year = currentDate.getYear();
    const month = currentDate.getMonth();
    if (month === 11) {
      setCurrentDate(new NepaliDate(year + 1, 0, 1));
    } else {
      setCurrentDate(new NepaliDate(year, month + 1, 1));
    }
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new NepaliDate());
  };

  // Generate year range (current year ± 100 years for flexibility)
  const generateYearRange = () => {
    const currentYear = new NepaliDate().getYear();
    const years = [];
    for (let i = currentYear - 100; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // Handle year change
  const handleYearChange = (newYear) => {
    const month = currentDate.getMonth();
    setCurrentDate(new NepaliDate(parseInt(newYear), month, 1));
  };

  // Handle month change
  const handleMonthChange = (newMonth) => {
    const year = currentDate.getYear();
    setCurrentDate(new NepaliDate(year, parseInt(newMonth), 1));
  };

  const calendarDays = generateCalendar();
  const year = currentDate.getYear();
  const month = currentDate.getMonth();

  // Check if a day is selected
  const isSelectedDay = (day) => {
    if (!displayValue || !day) return false;
    try {
      const [y, m, d] = displayValue.split("-").map(Number);
      return y === year && m === month + 1 && d === day;
    } catch {
      return false;
    }
  };

  // Check if a day is today
  const isToday = (day) => {
    if (!day) return false;
    const today = new NepaliDate();
    return (
      today.getYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  return (
    <div className="relative" ref={calendarRef}>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          onBlur={(e) => {
            // Validate and update on blur
            const inputValue = e.target.value;
            if (inputValue && /^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
              onChange(inputValue);
            }
          }}
          placeholder={placeholder || "YYYY-MM-DD (BS)"}
          className={`w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 text-sm focus:border-blue-500 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
        >
          <Calendar size={18} />
        </button>
      </div>

      {showCalendar && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4 w-80">
          {/* Header with month/year dropdowns and navigation */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <button
                type="button"
                onClick={previousMonth}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex-1 flex gap-2">
                {/* Month Dropdown */}
                <select
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {nepaliMonths.map((monthName, index) => (
                    <option key={index} value={index}>
                      {monthName}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-24 px-2 py-1 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {generateYearRange().map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Today button */}
            <div className="text-center">
              <button
                type="button"
                onClick={goToToday}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                आज (Today)
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"].map(
              (day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-600 py-1"
                >
                  {day}
                </div>
              )
            )}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  item.isCurrentMonth && handleDateSelect(item.day)
                }
                disabled={!item.isCurrentMonth}
                className={`
                  p-2 text-sm rounded-lg transition-colors
                  ${!item.isCurrentMonth ? "invisible" : ""}
                  ${
                    isSelectedDay(item.day)
                      ? "bg-blue-600 text-white font-semibold"
                      : isToday(item.day)
                      ? "bg-blue-100 text-blue-800 font-semibold"
                      : "hover:bg-slate-100 text-slate-700"
                  }
                `}
              >
                {item.day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NepaliDatePicker;
