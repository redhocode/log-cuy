"use client";
import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
}) => {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    const savedStartDate = localStorage.getItem("startDate");
    const savedEndDate = localStorage.getItem("endDate");
    if (savedStartDate) setStartDate(savedStartDate);
    if (savedEndDate) setEndDate(savedEndDate);
  }, []);

  const handleApply = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
      return;
    }
    localStorage.setItem("startDate", startDate || "");
    localStorage.setItem("endDate", endDate || "");
    onDateRangeChange(startDate, endDate);
  };

  return (
    <div className="flex flex-row gap-2 w-60 mb-4">
      <Input
        type="date"
        value={startDate || ""}
        onChange={(e) => setStartDate(e.target.value)}
        className="mr-2"
      />
      <span className="mt-2">to</span>
      <Input
        type="date"
        value={endDate || ""}
        onChange={(e) => setEndDate(e.target.value)}
        className="mr-2"
      />
      <Button
        onClick={handleApply}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Apply
      </Button>
    </div>
  );
};

export default DateRangePicker;
