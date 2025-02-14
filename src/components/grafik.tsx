import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Registering the necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Grafik = () => {
    const [dataChart, setDataChart] = useState<any>(null);
    const [startDate, setStartDate] = useState<string>("2023-01-01");
    const [endDate, setEndDate] = useState<string>("2023-12-31");

    // Fetch data from the API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/grafik?startDate=${startDate}&endDate=${endDate}`);
                const result = await response.json();
                if (result.error) {
                    console.error(result.error);
                    return;
                }
                setDataChart(result);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [startDate, endDate]); // Dependency on startDate and endDate

    // Prepare the data for the chart
    const chartData = {
        labels: dataChart ? dataChart.map((record: any) => `${record.tahun}-${record.bulan}`) : [],
        datasets: [
            {
                label: "Total Terjual (kgs)",
                data: dataChart ? dataChart.map((record: any) => record.total_terjual) : [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
            }
        ]
    };

    return (
        <div>
            <h2>Grafik Penjualan per Bulan</h2>

            {/* Input tanggal */}
            <div>
                <label htmlFor="startDate">Start Date: </label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="endDate">End Date: </label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>

            {/* Chart */}
            {dataChart ? (
                <Line data={chartData} />
            ) : (
                <p>Loading chart...</p>
            )}
        </div>
    );
};

export default Grafik;
