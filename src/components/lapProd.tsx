/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const LapProd = () => {
  const [startDate, setStartDate] = useState<string>("2024-12-01");
  const [endDate, setEndDate] = useState<string>("2024-12-31");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch data when startDate or endDate changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/lapprod", {
          params: { startDate, endDate },
        });
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  return (
    <div className="container">
      <h1>Production Dashboard</h1>

      {/* Date Range Input */}
      <div className="date-range">
        <label htmlFor="startDate">Start Date: </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label htmlFor="endDate">End Date: </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && <p>Loading...</p>}

      {/* Data Table */}
      {!loading && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>ProdType</th>
              <th>ItemID</th>
              <th>ItemType</th>
              <th>Bags</th>
              <th>Kgs</th>
              <th>DeptID</th>
              <th>OrderID</th>
              <th>LocID</th>
              <th>Remark</th>
              <th>UserName</th>
              <th>UserDateTime</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>{row.DateValue}</td>
                <td>{row.ProdType}</td>
                <td>{row.ItemID}</td>
                <td>{row.ItemType}</td>
                <td>{row.Bags || 0}</td>
                <td>{row.Kgs || 0}</td>
                <td>{row.DeptID}</td>
                <td>{row.OrderID}</td>
                <td>{row.LocID}</td>
                <td>{row.Remark}</td>
                <td>{row.UserName}</td>
                <td>{row.UserDateTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Empty Data */}
      {!loading && data.length === 0 && <p>No data available for this range</p>}
    </div>
  );
};

export default LapProd;
