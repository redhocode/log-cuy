"use client";
import { useState } from "react";

interface TransactionData {
  transId: number;
  taxRate: number;
  total: number;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
    tax: number;
    total: number;
  }>;
}

export default function OrderForm() {
  const [orderId, setOrderId] = useState("");
  const [taxRate, setTaxRate] = useState(11);
  const [transactionData, setTransactionData] =
    useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/notajual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, taxRate }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setTransactionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses order");
      setTransactionData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Sales Order Processing
      </h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pajak (PPN)
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={11}>11%</option>
                <option value={12}>12%</option>
              </select>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Memproses..." : "Proses Order"}
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          ⚠️ {error}
        </div>
      )}

      {transactionData && (
        <div className="border-t pt-6">
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-green-800 flex items-center">
              <span className="mr-2">✅ Berhasil Diproses</span>
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-700">ID Transaksi</p>
                <p className="font-medium text-green-900">
                  {transactionData.transId}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Total Pembayaran</p>
                <p className="font-medium text-green-900">
                  Rp {transactionData.total.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Tarif PPN</p>
                <p className="font-medium text-green-900">
                  {transactionData.taxRate}%
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Detail Order
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Kuantitas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Harga Satuan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    PPN
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactionData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.itemName}
                      </div>
                      <div className="text-sm text-gray-500">{item.itemId}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {item.quantity.toLocaleString("id-ID")} KG
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      Rp {item.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      Rp {item.tax.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Rp {item.total.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mr-3"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-gray-700">Memproses transaksi...</span>
          </div>
        </div>
      )}
    </div>
  );
}
