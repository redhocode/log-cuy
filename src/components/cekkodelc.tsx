
// components/cekkodelc.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface Item {
  ItemID: string;
  ItemName: string;
  ItemNameBuy: string;
  warna: string;
  Mark: string;
  KodeJenis: string;
  SatuanKecil: string;
  Spec: string;
  NamaJenis: string;
  UserName: string;
  UserDateTime: string;
  BaseItemID: string;
  IsLC: number;
}

interface FinishedGood {
  FinishedGoodID: string;
  FinishedGoodName: string;
  FinishedGoodBuyName: string;
  Unit: string;
  KodeJenis: string;
  JenisBarang: string;
  QuantityUsed: number;
  TransID: number;
  CreatedDate: string;
}

interface ItemPair {
  baseItemId: string;
  lcItem: Item | null;
  nonLcItem: Item | null;
  itemName: string;
  warna: string;
  satuan: string;
  jenis: string;
}

// Tambahkan interface baru untuk BOM Tree
interface BomTreeData {
  TransID: number;
  ItemidHD: string;
  itemnamehd: string;
  ItemID: string;
  ItemName: string;
  BahanQty: number;
  Departemen: string;
  KodeJenis: string;
}


export default function CekKodeLC() {
  const [allItemPairs, setAllItemPairs] = useState<ItemPair[]>([]);
  const [filteredItemPairs, setFilteredItemPairs] = useState<ItemPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // BOM state
  const [bomData, setBomData] = useState<{ [key: string]: FinishedGood[] }>({});
  const [bomLoading, setBomLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedItemForBom, setSelectedItemForBom] = useState<string | null>(null);
  const [initialBomLoading, setInitialBomLoading] = useState(true);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);

  // Fungsi untuk memeriksa apakah item mengandung RJ
  const containsRJ = useCallback((item: Item | null): boolean => {
    if (!item) return false;
    return item.ItemID.toUpperCase().endsWith('RJ') || 
           item.ItemID.toUpperCase().includes('-RJ') ||
           item.ItemID.toUpperCase().includes('_RJ');
  }, []);

  // Fungsi untuk memeriksa apakah pair mengandung RJ
  const pairContainsRJ = useCallback((pair: ItemPair): boolean => {
    return containsRJ(pair.lcItem) || containsRJ(pair.nonLcItem);
  }, [containsRJ]);

  // Fungsi untuk fetch data dan pairing LC vs Non-LC
  const fetchData = useCallback(async (searchQuery: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get<Item[]>(`/api/master/items`, {
        params: { search: searchQuery }
      });

      // Pairing items: LC vs Non-LC
      const pairedItems = pairLcAndNonLcItems(response.data);
      
      // Filter: hanya yang punya kode LC DAN tidak mengandung RJ
      const filteredItems = pairedItems.filter(pair => 
        pair.lcItem !== null && !pairContainsRJ(pair)
      );
      
      setAllItemPairs(filteredItems);
      setFilteredItemPairs(filteredItems);
      setCurrentPage(1);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pairContainsRJ]);

  // Fungsi untuk pairing LC dan Non-LC items
  const pairLcAndNonLcItems = (items: Item[]): ItemPair[] => {
    const pairsMap = new Map<string, ItemPair>();

    items.forEach(item => {
      const baseId = item.BaseItemID;
      
      if (!pairsMap.has(baseId)) {
        pairsMap.set(baseId, {
          baseItemId: baseId,
          lcItem: null,
          nonLcItem: null,
          itemName: item.ItemName,
          warna: item.warna,
          satuan: item.SatuanKecil,
          jenis: item.NamaJenis
        });
      }

      const pair = pairsMap.get(baseId)!;
      
      if (item.IsLC) {
        pair.lcItem = item;
      } else {
        pair.nonLcItem = item;
      }

      pair.itemName = item.ItemName;
      pair.warna = item.warna;
      pair.satuan = item.SatuanKecil;
      pair.jenis = item.NamaJenis;
    });

    return Array.from(pairsMap.values());
  };
// components/cekkodelc.tsx

// Pindahkan fetchBomData ke useCallback
const fetchBomData = useCallback(async (itemId: string) => {
  // Check cache lokal terlebih dahulu
  if (bomData[itemId]) {
    console.log(`[FRONTEND CACHE HIT] BOM data for ${itemId}`);
    return;
  }

  setBomLoading(prev => ({ ...prev, [itemId]: true }));
  
  try {
    console.log(`[FRONTEND FETCH] BOM data for ${itemId}`);
    const response = await axios.get<FinishedGood[]>(
      `/api/bom/v2?itemId=${encodeURIComponent(itemId)}`
    );
    setBomData(prev => ({ ...prev, [itemId]: response.data }));
  } catch (err) {
    console.error(`Error fetching BOM v2 for ${itemId}:`, err);
    setBomData(prev => ({ ...prev, [itemId]: [] }));
  } finally {
    setBomLoading(prev => ({ ...prev, [itemId]: false }));
  }
}, [bomData]);

// Modifikasi useEffect untuk loadAllBomData dengan batch
useEffect(() => {
  const loadAllBomData = async () => {
    if (allItemPairs.length === 0) return;
    
    setInitialBomLoading(true);
    
    try {
      // Batch requests - batasi concurrent requests
      const bomPromises: Promise<void>[] = [];
      const BATCH_SIZE = 5; // Maksimal 5 request bersamaan
      
      const itemsToFetch: string[] = [];
      
      // Kumpulkan semua item yang perlu di-fetch
      allItemPairs.forEach(pair => {
        if (pair.lcItem && !bomData[pair.lcItem.ItemID]) {
          itemsToFetch.push(pair.lcItem.ItemID);
        }
        if (pair.nonLcItem && !bomData[pair.nonLcItem.ItemID]) {
          itemsToFetch.push(pair.nonLcItem.ItemID);
        }
      });
      
      console.log(`[BATCH FETCH] Loading BOM for ${itemsToFetch.length} items`);
      
      // Process in batches
      for (let i = 0; i < itemsToFetch.length; i += BATCH_SIZE) {
        const batch = itemsToFetch.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(itemId => fetchBomData(itemId));
        bomPromises.push(...batchPromises);
        
        // Tunggu sebentar antara batch
        if (i + BATCH_SIZE < itemsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      await Promise.all(bomPromises);
    } catch (error) {
      console.error('Error loading BOM data:', error);
    } finally {
      setInitialBomLoading(false);
    }
  };
  
  loadAllBomData();
}, [allItemPairs, bomData, fetchBomData]);

// Load semua BOM data sekaligus (fallback)
useEffect(() => {
  const loadAllBomData = async () => {
    if (allItemPairs.length === 0) return;
    
    setInitialBomLoading(true);
    
    try {
      // Load BOM data untuk semua item LC dan Non-LC
      const bomPromises: Promise<void>[] = [];
      
      allItemPairs.forEach(pair => {
        if (pair.lcItem) {
          bomPromises.push(
            fetchBomData(pair.lcItem!.ItemID)
          );
        }
        if (pair.nonLcItem) {
          bomPromises.push(
            fetchBomData(pair.nonLcItem!.ItemID)
          );
        }
      });
      
      await Promise.all(bomPromises);
    } catch (error) {
      console.error('Error loading BOM data:', error);
    } finally {
      setInitialBomLoading(false);
    }
  };
  
  loadAllBomData();
}, [allItemPairs, fetchBomData]);

  // Fungsi untuk export ke Excel
  const exportToExcel = useCallback(async () => {
    try {
      setExportLoading(true);
      
      // Data untuk export
      const exportData = filteredItemPairs.map(pair => ({
        'Kode Dasar': pair.baseItemId,
        'Kode LC': pair.lcItem?.ItemID || '-',
        'Kode Non-LC': pair.nonLcItem?.ItemID || '-',
        'Nama Barang': pair.itemName,
        'Warna': pair.warna || '-',
        'Jenis': pair.jenis,
        'Satuan': pair.satuan,
        'Status': pair.lcItem && pair.nonLcItem ? 'Lengkap' : 
                 pair.lcItem ? 'Hanya LC' : 'Tidak Ada'
      }));

      // Buat workbook dan worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Tambahkan worksheet ke workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data Barang LC');
      
      // Generate file dan download
      const fileName = `Data_Barang_LC_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error saat mengexport data ke Excel');
    } finally {
      setExportLoading(false);
    }
  }, [filteredItemPairs]);

  // Handle search with debounce
  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (term.trim()) {
        const filtered = allItemPairs.filter(pair => 
          pair.baseItemId.toLowerCase().includes(term.toLowerCase()) ||
          pair.itemName.toLowerCase().includes(term.toLowerCase()) ||
          (pair.lcItem?.ItemID.toLowerCase().includes(term.toLowerCase())) ||
          (pair.nonLcItem?.ItemID.toLowerCase().includes(term.toLowerCase()))
        );
        setFilteredItemPairs(filtered);
      } else {
        setFilteredItemPairs(allItemPairs);
      }
      setCurrentPage(1);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setFilteredItemPairs(allItemPairs);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalItems = filteredItemPairs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItemPairs.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || initialBomLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-2"></div>
          <div className="text-lg">Loading data...</div>
          {initialBomLoading && (
            <div className="text-sm text-gray-500 mt-2">
              Memuat data BOM untuk {allItemPairs.length} barang...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="flex justify-between items-center">
          <span>Error: {error}</span>
          <button
            onClick={() => fetchData()}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daftar Barang dengan Kode LC (Non-RJ)</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded">
            Total: {totalItems} barang dengan kode LC (tanpa RJ) dan memiliki barang jadi
          </div>
          <button
            onClick={exportToExcel}
            disabled={exportLoading || filteredItemPairs.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export to Excel</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari berdasarkan kode barang, nama barang, atau kode dasar..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500 gap-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            ✓ Filter aktif: Hanya menampilkan barang dengan kode LC dan tanpa RJ
          </span>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
            🏭 BOM: Hanya barang jadi (K02)
          </span>
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
            🔍 Tabel: Hanya yang memiliki barang jadi
          </span>
        </div>
      </div>

      {/* Items Per Page Selector */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Menampilkan {Math.min(startIndex + 1, totalItems)}-{Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} barang
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Dasar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode LC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Non-LC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BOM
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((pair, index) => (
                <TableRow 
                  key={pair.baseItemId} 
                  pair={pair} 
                  index={index}
                  bomData={bomData}
                  bomLoading={bomLoading}
                  onShowBom={fetchBomData}
                  selectedItemForBom={selectedItemForBom}
                  setSelectedItemForBom={setSelectedItemForBom}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {filteredItemPairs.length === 0 && !initialBomLoading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <div>Tidak ada data yang ditemukan</div>
          <div className="text-sm mt-2">
            Tidak ada barang dengan kode LC (non-RJ) yang memiliki barang jadi (K02)
          </div>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tampilkan Semua Barang
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Komponen untuk menampilkan baris tabel
function TableRow({ 
  pair, 
  index, 
  bomData, 
  bomLoading, 
  onShowBom, 
  selectedItemForBom, 
  setSelectedItemForBom 
}: { 
  pair: ItemPair; 
  index: number;
  bomData: { [key: string]: FinishedGood[] };
  bomLoading: { [key: string]: boolean };
  onShowBom: (itemId: string) => void;
  selectedItemForBom: string | null;
  setSelectedItemForBom: (itemId: string | null) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const hasBoth = pair.lcItem && pair.nonLcItem;
  const hasOnlyLC = pair.lcItem && !pair.nonLcItem;

  const getStatusColor = () => {
    if (hasBoth) return 'bg-green-100 text-green-800';
    if (hasOnlyLC) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (hasBoth) return 'Lengkap';
    if (hasOnlyLC) return 'Hanya LC';
    return 'Tidak Ada';
  };

  const handleShowBom = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItemForBom === itemId) {
      setSelectedItemForBom(null);
    } else {
      setSelectedItemForBom(itemId);
      onShowBom(itemId);
    }
  };

  const hasBomData = (itemId: string) => {
    return bomData[itemId] && bomData[itemId].length > 0;
  };

  // FUNGSI BARU: Cek apakah item memiliki BOM data
  const hasAnyBomData = () => {
    const lcHasBom = pair.lcItem && hasBomData(pair.lcItem.ItemID);
    const nonLcHasBom = pair.nonLcItem && hasBomData(pair.nonLcItem.ItemID);
    return lcHasBom || nonLcHasBom;
  };

  // Jangan render jika tidak ada BOM data
  if (!hasAnyBomData()) {
    return null;
  }

  return (
    <>
      <tr 
        className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{pair.baseItemId}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {pair.lcItem && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {pair.lcItem.ItemID}
              </span>
              {hasBomData(pair.lcItem.ItemID) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Memiliki barang jadi">
                  ✓
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {pair.nonLcItem ? (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {pair.nonLcItem.ItemID}
              </span>
              {hasBomData(pair.nonLcItem.ItemID) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Memiliki barang jadi">
                  ✓
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 max-w-xs truncate" title={pair.itemName}>
            {pair.itemName}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{pair.warna || '-'}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{pair.jenis}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{pair.satuan}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex space-x-2">
            {pair.lcItem && (
              <button
                onClick={(e) => handleShowBom(pair.lcItem!.ItemID, e)}
                className={`text-xs px-3 py-1 rounded relative group ${
                  selectedItemForBom === pair.lcItem.ItemID
                    ? 'bg-blue-500 text-white'
                    : hasBomData(pair.lcItem.ItemID)
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                title="Lihat barang jadi (K02) yang menggunakan material ini"
              >
                {bomLoading[pair.lcItem.ItemID] ? '...' : 'BOM LC'}
                {/* Tooltip untuk K02 */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Lihat barang jadi (K02)
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </button>
            )}
            {pair.nonLcItem && (
              <button
                onClick={(e) => handleShowBom(pair.nonLcItem!.ItemID, e)}
                className={`text-xs px-3 py-1 rounded relative group ${
                  selectedItemForBom === pair.nonLcItem.ItemID
                    ? 'bg-green-500 text-white'
                    : hasBomData(pair.nonLcItem.ItemID)
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                title="Lihat barang jadi (K02) yang menggunakan material ini"
              >
                {bomLoading[pair.nonLcItem.ItemID] ? '...' : 'BOM Non-LC'}
                {/* Tooltip untuk K02 */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Lihat barang jadi (K02)
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {/* BOM Row */}
      {selectedItemForBom && (selectedItemForBom === pair.lcItem?.ItemID || selectedItemForBom === pair.nonLcItem?.ItemID) && (
        <tr className="bg-yellow-50">
          <td colSpan={9} className="px-6 py-4">
            <BomDetails 
              itemId={selectedItemForBom}
              bomData={bomData[selectedItemForBom] || []}
              loading={bomLoading[selectedItemForBom]}
            />
          </td>
        </tr>
      )}
      
      {/* Detail Row */}
      {showDetails && (
        <tr className="bg-blue-50">
          <td colSpan={9} className="px-6 py-4">
            <ItemDetails pair={pair} />
          </td>
        </tr>
      )}
    </>
  );
}

// Komponen untuk menampilkan detail BOM - DIPERBAIKI
function BomDetails({ itemId, bomData, loading }: { 
  itemId: string; 
  bomData: FinishedGood[]; 
  loading: boolean;
}) {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [bomTreeData, setBomTreeData] = useState<{ [key: string]: BomTreeData[] }>({});
  const [bomTreeLoading, setBomTreeLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string }>({});

  console.log('BomDetails rendered - itemId:', itemId, 'bomData:', bomData);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-sm text-gray-600">Loading BOM data...</span>
      </div>
    );
  }

  // Fungsi untuk toggle expand - DIPERBAIKI
  const toggleExpand = async (finishedGoodId: string) => {
    console.log('Toggle expand called for:', finishedGoodId);
    const isExpanded = expandedItems[finishedGoodId];
    
    // Jika sedang expand, collapse
    if (isExpanded) {
      setExpandedItems(prev => ({ ...prev, [finishedGoodId]: false }));
      return;
    }

    // Jika belum ada data BOM tree, fetch data
    if (!bomTreeData[finishedGoodId]) {
      console.log('Fetching BOM tree for:', finishedGoodId);
      setBomTreeLoading(prev => ({ ...prev, [finishedGoodId]: true }));
      setError(prev => ({ ...prev, [finishedGoodId]: '' }));
      
      try {
        const response = await axios.get<BomTreeData[]>(
          `/api/bom?itemid=${encodeURIComponent(finishedGoodId)}`
        );
        console.log('BOM tree response for', finishedGoodId, ':', response.data);
        setBomTreeData(prev => ({ ...prev, [finishedGoodId]: response.data }));
      } catch (err) {
        console.error(`Error fetching BOM tree for ${finishedGoodId}:`, err);
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || err.message 
          : 'Unknown error';
        setError(prev => ({ ...prev, [finishedGoodId]: errorMessage }));
        setBomTreeData(prev => ({ ...prev, [finishedGoodId]: [] }));
      } finally {
        setBomTreeLoading(prev => ({ ...prev, [finishedGoodId]: false }));
      }
    }

    // Expand item
    setExpandedItems(prev => ({ ...prev, [finishedGoodId]: true }));
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-yellow-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          Barang Jadi yang Menggunakan: {itemId}
        </h3>
        
        {/* Penanda K02 */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Hanya Barang Jadi (K02)
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Total: {bomData.length} barang
          </span>
        </div>
      </div>

      {/* Informasi Filter */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <div className="flex items-start">
          <svg className="w-4 h-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-purple-700">
            <strong>Filter Aktif:</strong> Menampilkan hanya barang jadi dengan KodeJenis <span className="font-mono bg-purple-100 px-1 rounded">K02</span>. 
            Barang setengah jadi atau material lain tidak ditampilkan.
          </div>
        </div>
      </div>
      
      {bomData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode Barang Jadi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang Jadi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Beli</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Buat</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bomData.map((finishedGood, index) => (
                <BomTreeRow 
                  key={`${finishedGood.TransID}-${index}`}
                  finishedGood={finishedGood}
                  isExpanded={!!expandedItems[finishedGood.FinishedGoodID]}
                  bomTreeData={bomTreeData[finishedGood.FinishedGoodID] || []}
                  bomTreeLoading={!!bomTreeLoading[finishedGood.FinishedGoodID]}
                  error={error[finishedGood.FinishedGoodID]}
                  onToggleExpand={() => toggleExpand(finishedGood.FinishedGoodID)}
                />
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
            <span>
              Menampilkan {bomData.length} barang jadi yang menggunakan material <strong>{itemId}</strong>
            </span>
            <span className="text-purple-600 font-medium">
              ✓ Semua barang adalah barang jadi (K02)
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <div className="text-2xl mb-2">🏭</div>
          <div>Tidak ada barang jadi (K02) yang menggunakan material ini</div>
          <div className="text-sm mt-1">
            Material <strong>{itemId}</strong> tidak digunakan dalam produksi <strong>barang jadi (K02)</strong>
          </div>
          <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded-lg inline-block">
            ℹ️ Hanya menampilkan barang dengan KodeJenis K02
          </div>
        </div>
      )}
    </div>
  );
}

// Komponen untuk baris BOM Tree - DIPERBAIKI
function BomTreeRow({ 
  finishedGood, 
  isExpanded, 
  bomTreeData, 
  bomTreeLoading, 
  error,
  onToggleExpand 
}: { 
  finishedGood: FinishedGood;
  isExpanded: boolean;
  bomTreeData: BomTreeData[];
  bomTreeLoading: boolean;
  error?: string;
  onToggleExpand: () => void;
}) {
  console.log('BomTreeRow rendered:', finishedGood.FinishedGoodID, 'isExpanded:', isExpanded, 'bomTreeData length:', bomTreeData.length);

  return (
    <>
      {/* Baris utama barang jadi */}
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2 whitespace-nowrap">
          <button
            onClick={onToggleExpand}
            className={`w-6 h-6 flex items-center justify-center rounded border ${
              bomTreeData.length > 0 || bomTreeLoading
                ? 'bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
            }`}
            disabled={bomTreeLoading}
            title={bomTreeLoading ? "Loading..." : "Lihat BOM Tree"}
          >
            {bomTreeLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            ) : (
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
              {finishedGood.FinishedGoodID}
            </span>
            {finishedGood.KodeJenis === 'K02' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Barang Jadi">
                ✓
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2">
          <div title={finishedGood.FinishedGoodName}>
            {finishedGood.FinishedGoodName}
          </div>
        </td>
        <td className="px-4 py-2">
          {finishedGood.FinishedGoodBuyName || '-'}
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
            {finishedGood.QuantityUsed}
          </span>
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          {finishedGood.Unit}
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <span>{finishedGood.JenisBarang}</span>
            {finishedGood.KodeJenis === 'K02' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                K02
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
          {new Date(finishedGood.CreatedDate).toLocaleDateString('id-ID')}
        </td>
      </tr>

      {/* Baris expanded BOM Tree */}
      {isExpanded && (
        <tr className="bg-blue-50">
          <td colSpan={8} className="px-4 py-3">
            <div className="ml-6 border-l-2 border-blue-200 pl-4">
              <BomTreeContent 
                bomTreeData={bomTreeData}
                loading={bomTreeLoading}
                error={error}
                finishedGoodId={finishedGood.FinishedGoodID}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Komponen untuk konten BOM Tree - DIPERBAIKI
function BomTreeContent({ 
  bomTreeData, 
  loading, 
  error,
  finishedGoodId 
}: { 
  bomTreeData: BomTreeData[];
  loading: boolean;
  error?: string;
  finishedGoodId: string;
}) {
  console.log('BomTreeContent rendered:', finishedGoodId, 'loading:', loading, 'data length:', bomTreeData.length, 'error:', error);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-sm text-gray-600">Loading BOM tree...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <div className="text-lg mb-1">❌</div>
        <div>Error loading BOM tree</div>
        <div className="text-sm mt-1">{error}</div>
      </div>
    );
  }

  if (bomTreeData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <div className="text-lg mb-1">📦</div>
        <div>Tidak ada data BOM tree</div>
        <div className="text-sm">Barang jadi ini tidak memiliki komponen dalam BOM</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h4 className="font-semibold text-gray-800 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          BOM Tree - {finishedGoodId}
        </h4>
        <div className="text-xs text-gray-600 mt-1">
          Menampilkan {bomTreeData.length} komponen dalam Bill of Materials
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode Komponen</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Komponen</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode Jenis</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bomTreeData.map((item, index) => (
              <tr key={`${item.TransID}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {item.ItemID}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div title={item.ItemName} className="max-w-xs truncate">
                    {item.ItemName}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                    {item.BahanQty}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {item.Departemen || '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {item.KodeJenis}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <strong>Total Komponen:</strong> {bomTreeData.length} item
          {' • '}
          <strong>Total Quantity:</strong> {bomTreeData.reduce((sum, item) => sum + item.BahanQty, 0)}
        </div>
      </div>
    </div>
  );
}

// Komponen untuk menampilkan detail item
function ItemDetails({ pair }: { pair: ItemPair }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LC Item Details */}
      <div className="bg-white p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          Detail Barang LC
        </h3>
        {pair.lcItem ? (
          <div className="space-y-2 text-sm">
            <DetailItem label="Kode Barang" value={pair.lcItem.ItemID} />
            <DetailItem label="Nama Beli" value={pair.lcItem.ItemNameBuy} />
            <DetailItem label="Mark" value={pair.lcItem.Mark} />
            <DetailItem label="Spesifikasi" value={pair.lcItem.Spec} />
            <DetailItem 
              label="Diinput Oleh" 
              value={`${pair.lcItem.UserName} pada ${new Date(pair.lcItem.UserDateTime).toLocaleString('id-ID')}`} 
            />
          </div>
        ) : (
          <div className="text-gray-500 text-sm">Tidak ada data barang LC</div>
        )}
      </div>

      {/* Non-LC Item Details */}
      <div className="bg-white p-4 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          Detail Barang Non-LC
        </h3>
        {pair.nonLcItem ? (
          <div className="space-y-2 text-sm">
            <DetailItem label="Kode Barang" value={pair.nonLcItem.ItemID} />
            <DetailItem label="Nama Beli" value={pair.nonLcItem.ItemNameBuy} />
            <DetailItem label="Mark" value={pair.nonLcItem.Mark} />
            <DetailItem label="Spesifikasi" value={pair.nonLcItem.Spec} />
            <DetailItem 
              label="Diinput Oleh" 
              value={`${pair.nonLcItem.UserName} pada ${new Date(pair.nonLcItem.UserDateTime).toLocaleString('id-ID')}`} 
            />
          </div>
        ) : (
          <div className="text-gray-500 text-sm">Tidak ada data barang Non-LC</div>
        )}
      </div>
    </div>
  );
}

// Komponen untuk menampilkan item detail
function DetailItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  
  return (
    <div className="flex">
      <span className="font-medium text-gray-700 w-32 flex-shrink-0">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

// Komponen Pagination
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Menampilkan halaman <span className="font-medium">{currentPage}</span> dari{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  currentPage === page
                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}