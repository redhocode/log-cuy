// components/DateRangePicker.tsx
"use client";

import React, { useState } from "react";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
}) => {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const handleApply = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
      return;
    }
    onDateRangeChange(startDate, endDate);
  };

  return (
    <div className="mb-4">
      <input
        type="date"
        value={startDate || ""}
        onChange={(e) => setStartDate(e.target.value)}
        className="mr-2"
      />
      <input
        type="date"
        value={endDate || ""}
        onChange={(e) => setEndDate(e.target.value)}
        className="mr-2"
      />
      <button
        onClick={handleApply}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Cari
      </button>
    </div>
  );
};

export default DateRangePicker;
