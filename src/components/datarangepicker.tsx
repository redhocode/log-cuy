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
  const [singleDate, setSingleDate] = useState<string | null>(null);
  const [isSingleDate, setIsSingleDate] = useState<boolean>(false);

  useEffect(() => {
    const savedStartDate = localStorage.getItem("startDate");
    const savedEndDate = localStorage.getItem("endDate");
    const savedSingleDate = localStorage.getItem("singleDate");

    if (savedStartDate) setStartDate(savedStartDate);
    if (savedEndDate) setEndDate(savedEndDate);
    if (savedSingleDate) setSingleDate(savedSingleDate);
  }, []);

const handleApply = () => {
  if (isSingleDate) {
    localStorage.setItem("singleDate", singleDate || "");
    onDateRangeChange(singleDate, null); // Send single date to parent
  } else {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
      return;
    }
    localStorage.setItem("startDate", startDate || "");
    localStorage.setItem("endDate", endDate || "");
    onDateRangeChange(startDate, endDate); // Send date range to parent
  }
};


  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex flex-row gap-2">
        <Input
          type="date"
          value={startDate || ""}
          onChange={(e) => {
            setStartDate(e.target.value);
            setIsSingleDate(false);
          }}
          className="mr-2"
        />
        <span className="mt-2">to</span>
        <Input
          type="date"
          value={endDate || ""}
          onChange={(e) => {
            setEndDate(e.target.value);
            setIsSingleDate(false);
          }}
          className="mr-2"
        />
      </div>

      {/* <div className="flex flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsSingleDate(true);
            setStartDate(null);
            setEndDate(null);
          }}
          className="px-4 py-2 bg-gray-300 text-black rounded"
        >
          Pencarian Satu Tanggal
        </Button>
        <Input
          type="date"
          value={singleDate || ""}
          onChange={(e) => setSingleDate(e.target.value)}
          className={isSingleDate ? "block" : "hidden"}
        />
      </div> */}

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
