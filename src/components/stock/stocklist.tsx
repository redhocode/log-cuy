/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";

const StockList = () => {
  const [data, setData] = useState<any[]>([]); // Store data from API
  const [filteredData, setFilteredData] = useState<any[]>([]); // Filtered data for search
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error message
  const [searchQuery, setSearchQuery] = useState<string>(""); // Store search query
  const debounceTimeout = useRef<any>(null); // For debouncing the search input

  // Hard-coded period (no combobox anymore)
  const periodeR = "201905";

  // Fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split("T")[0]; // Format: yyyy-mm-dd

        const response = await fetch(
          `/api/stock?periodeR=${periodeR}&loc=GUDUT&item=%&tgl=${formattedDate}&company=0&tipestock=0&jenisbarang=3&kategori=BAHAN%20BAKU&minus=0`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const result = await response.json();
        if (result.data) {
          setData(result.data); // Store data
          setFilteredData(result.data); // Initialize filtered data with all data
        } else {
          setError("No data found");
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message); // Handle any errors
      } finally {
        setLoading(false); // Set loading to false when done
      }
    };

    fetchData();
  }, []); // Fetch data only once when component mounts

  // Handle search input change with debounce
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      // Filter data based on search query
      const filtered = data.filter(
        (item) =>
          item.itemid.toLowerCase().includes(query.toLowerCase()) ||
          item.itemname.toLowerCase().includes(query.toLowerCase()) ||
          item.kategori.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered); // Update filtered data
    }, 300); // 300ms delay for debounce
  };

  // Calculate final stock (stock akhir) for each item by summing total Kg
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStockAkhirPerItem = (data: any[]) => {
    const stockAkhirMap: { [key: string]: number } = {};

    data.forEach((item) => {
      const { itemid, totalkgs } = item;
      if (!totalkgs) return;
      if (stockAkhirMap[itemid]) {
        stockAkhirMap[itemid] += totalkgs;
      } else {
        stockAkhirMap[itemid] = totalkgs;
      }
    });

    // Menambahkan stok akhir ke data asli
    return data.map((item) => ({
      ...item,
      stockAkhir: stockAkhirMap[item.itemid] || 0, // Menambahkan stok akhir, default 0 jika tidak ditemukan
    }));
  };

  // Calculate stock akhir for each item
  const dataWithStockAkhir = getStockAkhirPerItem(filteredData);

  // Filter only items with stockAkhir < 10 and exclude stockAkhir == 0
  const filteredItemsWithStockAkhir = dataWithStockAkhir.filter(
    (item) => item.stockAkhir > 0 && item.stockAkhir < 10
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Stock Bahan Baku</h1>

      {/* Input search */}
      <div>
        <input
          type="text"
          placeholder="Search by ItemID, ItemName, or Category"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
        />
      </div>

      {/* Display the selected period (hardcoded) */}
      <div className="mb-2 text-red-500">
        <h1>Stock Menipis Harap Segera Membuat Form Permintaan</h1>
      </div>

      {/* Table to display the stock data with stock akhir */}
      <table border={1} style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>ItemID</th>
            <th>Name</th>
            <th>Stock</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {filteredItemsWithStockAkhir.map((item, index) => (
            <tr key={index}>
              <td>{item.itemid}</td>
              <td>{item.itemname}</td>
              <td className="mr-4">{item.stockAkhir}</td>
              <td>{item.kategori}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockList;
