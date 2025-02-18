/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";

const itemsToCheck = [
  "ABS CHIMEY PA-757",
  "pewarna 1834 (hitam)",
  "POM M90 CF 2001 Natural (Jerman)",
  "POM HOSTAFORM",
  "POM BASF",
  "POM recycle ",
  "ABS RECYCLE ORI HITAM",
  "ABS RECYCLE ORI PUTIH",
  "ABS resin VA-14",
  "PC RESIN PC-110 CHIMEY",
  "PS RESIN GPPS CHIMEY PG- 80N",
  "PP TAIRIPRO",
  "PP PUTIH RECYCLE",
  "PP HITAM RECYCLE",
  "PP HITAM PELET",
  "PPO resin",
  "PE-7042 RESIN",
  "LLDPE 0209 SR",
  "PVC Resin",
  "TPR RESIN",
  "TPE RESIN",
  "PMMA resin",
  "POM AMCEL KP-20 NATURAL",
  "POLYPROPYLENE PP GRADE NO.K7005",
  "TPE resin I775VN-L109",
  "TPE resin I475NN-P347",
  "TPE resin I965VN-L74",
  "GRAY PP RESIN",
  "POM resin +10g",
  "GPPS(SAMPLE)",
  "IUPITAL TG20",
  "ABS Terluran GP 22",
  "PP resin 8296PP resin 8296",
  "PP resin 8290Valterra",
  "ABS resin 777E",
  "STYRENE-ACRYLONITRILE (SAN) RESIN",
  "POM RESIN CELCON M25 NATURAL",
  "BLACK COLOR MASTERBATCH PP RESIN",
  "IUPITAL TG30",
  "POM Iupital F20-03",
  "POM RESIN M9010",
  "ABS RECYCLE ORI HITAM 2",
  "GPPS 525N",
  "POM Formocon FM090",
  "GPPS 866",
  "POM Kocetal K300-EW",
  "ABS RESIN ER400",
  "GPPS VNPS 525N",
  "POM Formocon FM090-R6",
  "POM Formocon FM025",
  "PP RESIN SAMPLE",
  "ABS PA-757",
  "ABS RESIN 1000D",
  "ABS RESIN 5000",
  "ABS resin",
  "ABS RESIN PA-727",
  "ABS RESIN D150 (SAMPLE)",
  "POM RESIN M20N (SAMPLE)",
  "NORYL PPO GFN20-701",
  "POLYACETAL CO-POLYMER (POM) DURACONO M90-44 WK2001",
  "POM M90-44",
  "PE RESIN FC21HN-MI-1",
  "ABS CHI MEI PA 727",
  "Strech Film",
  "Solasi bening besar",
  "solasi bening kecil",
  "pewarna W-5955 (PP PUTIH)",
  "pewarna 1820 (PC COFFE)",
  "pewarna hitam",
  "pewarna putih pp/ titanium",
  "pewarna L-6110 (PS COFFE)",
  "pewarna W 5799 (HIJAU)",
  "pewarna Y 5779(ABS CREAM)",
  "pewarna Y 6306 (ABS CREAM SPESIAL)",
  "pewarna Y-6307 (PP CREAM SPESIAL)",
  "pewarna L 6111 (TPR GREY)",
  "pewarna 3961 (merah)",
  "pewarna W-5799 (PUTIH)",
  "pewarna L-5780 (ABS grey)",
  "pewarna L-6085 (POM GREY)",
  "pewarna sampanye",
  "pewarna blue 2900",
  "pewarna pewarna 3960 biru",
  "PP resin",
  "Pigmen powderpewarna PP Putih",
  "Pigment powder 6228",
  "Pigment powder L-4195",
  "Pigment powder  L-5799 white",
  "Pigment powder 9214-1",
  "Pigmen PowderBLack DCA 7703",
  "Pigment Powder HBM201",
];

const StockList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const debounceTimeout = useRef<any>(null);

  const periodeR = "201905";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split("T")[0];

        const response = await fetch(
          `/api/stock?periodeR=${periodeR}&loc=GUDUT&item=%&tgl=${formattedDate}&company=0&tipestock=0&jenisbarang=3&kategori=BAHAN%20BAKU&minus=0`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const result = await response.json();
        if (result.data) {
          setData(result.data);
          setFilteredData(result.data);
        } else {
          setError("No data found");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fungsi untuk mengirim pesan ke Telegram
  const sendTelegramMessage = async (message: string) => {
    try {
      const response = await fetch("/api/notif", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Message sent to Telegram:", message);
      } else {
        console.error("Failed to send message to Telegram");
      }
    } catch (error) {
      console.error("Error sending message to Telegram:", error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const filtered = data.filter(
        (item) =>
          item.itemid.toLowerCase().includes(query.toLowerCase()) ||
          item.itemname.toLowerCase().includes(query.toLowerCase()) ||
          item.kategori.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }, 300);
  };

  const getStockAkhirPerItem = (data: any[]) => {
    const stockAkhirMap: { [key: string]: number } = {};
    const uniqueItemsMap: { [key: string]: any } = {};

    data.forEach((item) => {
      const { itemid, totalkgs } = item;

      // Konversi totalkgs ke number dan pastikan tidak NaN
      const total = parseFloat(totalkgs) || 0;
      if (isNaN(total)) {
        console.log(`Invalid totalKgs for item ${item.itemid}: ${totalkgs}`);
      }
      if (stockAkhirMap[itemid]) {
        stockAkhirMap[itemid] += total;
      } else {
        stockAkhirMap[itemid] = total;
      }

      if (!uniqueItemsMap[itemid]) {
        uniqueItemsMap[itemid] = item;
      }
    });

    return Object.values(uniqueItemsMap).map((item) => ({
      ...item,
      // Bulatkan ke bilangan bulat terdekat
      stockAkhir: Math.round(stockAkhirMap[item.itemid] || 0),
    }));
  };

  const dataWithStockAkhir = getStockAkhirPerItem(filteredData);

  const filteredItemsWithStockAkhir = dataWithStockAkhir.filter(
    (item) => itemsToCheck.includes(item.itemname.trim()) && item.stockAkhir  <=50
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Kirim pesan ke Telegram jika ada item dengan stok menipis
  if (filteredItemsWithStockAkhir.length > 0) {
    const message =
      `Stok barang berikut menipis, harap segera buat form permintaan:\n\n` +
      filteredItemsWithStockAkhir
        .map((item) => `- ${item.itemid} - ${item.itemname} (Stock: ${item.stockAkhir})`)
        .join("\n");

    sendTelegramMessage(message);
  }

  return (
    <div>
      <h1>Stock Bahan Baku</h1>

      <div>
        <input
          type="text"
          placeholder="Search by ItemID, ItemName, or Category"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
        />
      </div>

      {filteredItemsWithStockAkhir.length > 0 ? (
        <>
          <div className="mb-2 text-red-500">
            <h1>Stock Menipis Harap Segera Membuat Form Permintaan</h1>
          </div>

          <table
            border={2}
            style={{ width: "100%", textAlign: "left" }}
            className="table-fixed"
          >
            <thead>
              <tr>
                <th>ItemID</th>
                <th>Name</th>
                <th>Stock</th>
                <th>Kategori</th>
              </tr>
            </thead>
            <tbody>
              {filteredItemsWithStockAkhir.map((item, index) => (
                <tr key={index}>
                  <td>{item.itemid}</td>
                  <td>{item.itemname}</td>
                  <td>{item.stockAkhir}</td>
                  <td>{item.kategori}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="mb-2 text-gray-500">
          <h1>Tidak ada data</h1>
        </div>
      )}
    </div>
  );
};

export default StockList;
