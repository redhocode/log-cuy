"use client";

import React, { useState } from "react";

interface SearchFormProps {
  onSearch: (filters: {
    startDate: string;
    endDate: string;
    remark: string;
  }) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [remark, setRemark] = useState<string>("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch({ startDate, endDate, remark });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="startDate" className="block">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <div>
        <label htmlFor="endDate" className="block">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <div>
        <label htmlFor="remark" className="block">
          Remark
        </label>
        <input
          type="text"
          id="remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className="border p-2 rounded"
          placeholder="e.g., 16438"
        />
      </div>

      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Search
      </button>
    </form>
  );
};

export default SearchForm;
