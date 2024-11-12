// ChartComponent.tsx
"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

interface ChartComponentProps {
  chartData: {
    month: string;
    bahan: number;
    hasil: number;
  }[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ chartData }) => {
  if (!chartData || chartData.length === 0) {
    return <div>No data available for chart</div>;
  }

  return (
    <div className="chart-container">
      <h3 className="text-center mb-4">Data Produksi Chart</h3>
      <BarChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="bahan" fill="#2563eb" name="Bahan" />
        <Bar dataKey="hasil" fill="#60a5fa" name="Hasil" />
      </BarChart>
    </div>
  );
};

export default ChartComponent;
