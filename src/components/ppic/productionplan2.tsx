/* eslint-disable @typescript-eslint/no-explicit-any */
// app/production-plan/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";

// ==================== TIPE DATA ====================
// Data Order Produksi (SPK)
interface DataOrder {
  No_SPK: string;
  Tanggal_Order: string;
  Nama_PO: string;
  Kode_Barang: string;
  QTY: number | null;
}

// Data Bahan Baku (BOM)
interface DataBahan {
  TransID: number;
  Level: number;
  ParentItemID: string | null;
  ParentItemName: string | null;
  ItemID: string;
  ItemName: string;
  Qty: number;
  CumulativeQty: number;
  Departemen: string;
  NamaJenis: string;
  ItemPath: string;
  SortPath: string;
}

// Data BOM dalam bentuk pohon
interface DataBohon extends DataBahan {
  children?: DataBohon[];
  requiredQty?: number;
  totalRequiredQty?: number;
  stockTersedia?: number; // Stok yang tersedia
  kekurangan?: number; // Kekurangan stok
  perluBeli?: number; // Jumlah yang perlu dibeli
}

// Response dari API BOM
interface ResponseBOM {
  flat: DataBahan[];
  tree: DataBohon[];
}

// Data Stok
interface DataStok {
  itemid: string;
  itemname: string;
  stockAkhir: number;
  kategori: string;
  totalkgs: string;
}

// Data lengkap untuk perencanaan produksi
interface DataProduksi extends DataOrder {
  bom?: ResponseBOM;
  expanded?: boolean;
  loadingBom?: boolean;
  errorBom?: string;
  viewMode?: "flat" | "tree";
  calculatedBom?: DataBohon[];
}

// ==================== FUNGSI BANTU ====================
// Format angka ke format Indonesia
const formatAngka = (
  value: number | null,
  defaultValue: string = "0"
): string => {
  if (value === null || value === undefined) return defaultValue;
  return value.toLocaleString("id-ID");
};

// Pastikan angka tidak null
const pastikanAngka = (value: number | null): number => {
  return value === null ? 0 : value;
};

// ==================== KOMPONEN POHON BOM DENGAN STOK ====================
const PohonBOM: React.FC<{
  dataPohon: DataBohon[];
  jumlahProduksi: number;
  dataStok: DataStok[];
  tampilkanKebutuhan?: boolean;
}> = ({ dataPohon, jumlahProduksi, dataStok, tampilkanKebutuhan = true }) => {
  const [nodeTerbuka, setNodeTerbuka] = useState<Set<string>>(new Set());
  const [pencarian, setPencarian] = useState("");

  // Cari stok untuk item tertentu
  const cariStok = (itemId: string): number => {
    const stokItem = dataStok.find((stok) => stok.itemid === itemId);
    return stokItem ? stokItem.stockAkhir : 0;
  };

  // Hitung kebutuhan, stok, dan kekurangan
  const hitungKebutuhanDenganStok = (
    node: DataBohon,
    productionQty: number
  ) => {
    const kebutuhan = node.Qty * productionQty;
    const stokTersedia = cariStok(node.ItemID);
    const kekurangan = Math.max(0, kebutuhan - stokTersedia);
    const perluBeli = kekurangan > 0 ? kekurangan : 0;

    return {
      kebutuhan,
      stokTersedia,
      kekurangan,
      perluBeli,
    };
  };

  // Saat data pohon berubah, buka node root
  useEffect(() => {
    if (dataPohon.length > 0) {
      setNodeTerbuka(new Set([dataPohon[0].ItemID]));
    }
  }, [dataPohon]);

  // Buka/tutup node
  const toggleNode = (nodeId: string) => {
    setNodeTerbuka((prev) => {
      const setBaru = new Set(prev);
      if (setBaru.has(nodeId)) {
        setBaru.delete(nodeId);
      } else {
        setBaru.add(nodeId);
      }
      return setBaru;
    });
  };

  // Buka semua node
  const bukaSemua = () => {
    const semuaNodeId = new Set<string>();
    const kumpulkanNodeId = (nodes: DataBohon[]) => {
      nodes.forEach((node) => {
        semuaNodeId.add(node.ItemID);
        if (node.children) {
          kumpulkanNodeId(node.children);
        }
      });
    };
    kumpulkanNodeId(dataPohon);
    setNodeTerbuka(semuaNodeId);
  };

  // Tutup semua node kecuali root
  const tutupSemua = () => {
    if (dataPohon.length > 0) {
      setNodeTerbuka(new Set([dataPohon[0].ItemID]));
    } else {
      setNodeTerbuka(new Set());
    }
  };

  // Filter pohon berdasarkan pencarian
  const pohonTersaring = useMemo(() => {
    if (!pencarian.trim()) return dataPohon;

    const filterNodes = (nodes: DataBohon[]): DataBohon[] => {
      return nodes
        .map((node) => {
          const cocokPencarian =
            node.ItemID.toLowerCase().includes(pencarian.toLowerCase()) ||
            node.ItemName.toLowerCase().includes(pencarian.toLowerCase()) ||
            node.Departemen.toLowerCase().includes(pencarian.toLowerCase()) ||
            node.NamaJenis.toLowerCase().includes(pencarian.toLowerCase());

          const anakTersaring = node.children ? filterNodes(node.children) : [];

          if (cocokPencarian || anakTersaring.length > 0) {
            return {
              ...node,
              children: anakTersaring,
            };
          }
          return null;
        })
        .filter(Boolean) as DataBohon[];
    };

    return filterNodes(dataPohon);
  }, [dataPohon, pencarian]);

  // Hitung statistik pohon dengan stok
  const statistikPohon = useMemo(() => {
    const hitungStatistik = (nodes: DataBohon[]) => {
      let totalItem = 0;
      let levelTertinggi = 0;
      let totalQuantityDasar = 0;
      let totalKebutuhan = 0;
      let totalKekurangan = 0;
      let totalPerluBeli = 0;

      const jelajahi = (nodes: DataBohon[]) => {
        nodes.forEach((node) => {
          totalItem++;
          levelTertinggi = Math.max(levelTertinggi, node.Level);
          totalQuantityDasar += pastikanAngka(node.Qty);

          // Hitung kebutuhan berdasarkan jumlah produksi
          const { kebutuhan, kekurangan, perluBeli } =
            hitungKebutuhanDenganStok(node, jumlahProduksi);
          totalKebutuhan += kebutuhan;
          totalKekurangan += kekurangan;
          totalPerluBeli += perluBeli;

          if (node.children) {
            jelajahi(node.children);
          }
        });
      };

      jelajahi(nodes);
      return {
        totalItem,
        levelTertinggi,
        totalQuantityDasar,
        totalKebutuhan,
        totalKekurangan,
        totalPerluBeli,
      };
    };

    return hitungStatistik(pohonTersaring);
  }, [pohonTersaring, jumlahProduksi, dataStok]);

  // Komponen untuk setiap item dalam pohon
  const ItemPohon: React.FC<{
    node: DataBohon;
    nodeTerbuka: Set<string>;
    onToggle: (nodeId: string) => void;
    pencarian?: string;
    jumlahProduksi: number;
    tampilkanKebutuhan?: boolean;
  }> = ({
    node,
    nodeTerbuka,
    onToggle,
    pencarian = "",
    jumlahProduksi,
    tampilkanKebutuhan,
  }) => {
    const punyaAnak = node.children && node.children.length > 0;
    const terbuka = nodeTerbuka.has(node.ItemID);
    const nodeRoot = node.Level === 0 && !node.ParentItemID;

    // Hitung kebutuhan dengan stok
    const { kebutuhan, stokTersedia, kekurangan, perluBeli } =
      hitungKebutuhanDenganStok(node, jumlahProduksi);

    // Warna untuk setiap level
    const warnaLevel = (level: number) => {
      const warna = [
        "#e8f5e8", // Level 0 - Hijau muda (root)
        "#e3f2fd", // Level 1 - Biru muda
        "#f3e5f5", // Level 2 - Ungu muda
        "#fff3e0", // Level 3 - Oranye muda
        "#fce4ec", // Level 4 - Pink muda
        "#e0f2f1", // Level 5 - Teal muda
      ];
      return warna[level % warna.length];
    };

    // Warna untuk status stok
    const warnaStatusStok = (kekurangan: number) => {
      if (kekurangan === 0) return "#27ae60"; // Hijau - stok cukup
      if (kekurangan > 0) return "#e74c3c"; // Merah - stok kurang
      return "#95a5a6"; // Abu-abu - tidak ada data
    };

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            borderBottom: "1px solid #e9ecef",
            backgroundColor: warnaLevel(node.Level),
            marginLeft: nodeRoot ? "0px" : `${node.Level * 20}px`,
            transition: "all 0.2s ease",
            borderLeft: nodeRoot
              ? "none"
              : `4px solid ${warnaStatusStok(kekurangan)}`,
            borderTop: nodeRoot ? "2px solid #4caf50" : "none",
          }}
          onDoubleClick={() => punyaAnak && onToggle(node.ItemID)}
        >
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            {punyaAnak ? (
              <button
                onClick={() => onToggle(node.ItemID)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "8px",
                  borderRadius: "3px",
                  backgroundColor: "#e9ecef",
                }}
              >
                {terbuka ? "−" : "+"}
              </button>
            ) : (
              <div
                style={{
                  width: "24px",
                  marginRight: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6c757d",
                }}
              >
                {nodeRoot ? "🏠" : "•"}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    marginRight: "10px",
                    minWidth: "100px",
                    fontSize: nodeRoot ? "14px" : "13px",
                    color: nodeRoot ? "#2e7d32" : "#333",
                  }}
                >
                  {node.ItemID}
                  {nodeRoot && (
                    <span
                      style={{
                        marginLeft: "8px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      PRODUK UTAMA
                    </span>
                  )}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: nodeRoot ? "14px" : "13px",
                    fontWeight: nodeRoot ? "bold" : "normal",
                  }}
                >
                  {node.ItemName}
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      minWidth: "50px",
                      textAlign: "right",
                      color: "#2c3e50",
                      fontSize: nodeRoot ? "14px" : "12px",
                    }}
                    title="Jumlah per 1 unit produk"
                  >
                    {formatAngka(node.Qty)}
                  </span>

                  {tampilkanKebutuhan && (
                    <>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          minWidth: "70px",
                          textAlign: "right",
                          color: "#e74c3c",
                          fontSize: nodeRoot ? "14px" : "12px",
                          backgroundColor: "rgba(231, 76, 60, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          border: "1px solid #e74c3c",
                        }}
                        title={`Kebutuhan untuk ${jumlahProduksi} unit`}
                      >
                        ⚡{formatAngka(kebutuhan)}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          minWidth: "60px",
                          textAlign: "right",
                          color: "#27ae60",
                          fontSize: nodeRoot ? "14px" : "12px",
                          backgroundColor: "rgba(39, 174, 96, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          border: "1px solid #27ae60",
                        }}
                        title="Stok yang tersedia"
                      >
                        📦{formatAngka(stokTersedia)}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          minWidth: "70px",
                          textAlign: "right",
                          color: kekurangan > 0 ? "#e74c3c" : "#27ae60",
                          fontSize: nodeRoot ? "14px" : "12px",
                          backgroundColor:
                            kekurangan > 0
                              ? "rgba(231, 76, 60, 0.1)"
                              : "rgba(39, 174, 96, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          border:
                            kekurangan > 0
                              ? "1px solid #e74c3c"
                              : "1px solid #27ae60",
                        }}
                        title={
                          kekurangan > 0 ? "Kekurangan stok" : "Stok mencukupi"
                        }
                      >
                        {kekurangan > 0 ? "❌" : "✅"}
                        {formatAngka(kekurangan)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#6c757d",
                  marginTop: "2px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {node.Departemen && <span>Dept: {node.Departemen}</span>}
                {node.NamaJenis && <span>Jenis: {node.NamaJenis}</span>}
                <span>Level: {node.Level}</span>
                {tampilkanKebutuhan && (
                  <>
                    <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                      Butuh: {formatAngka(kebutuhan)}
                    </span>
                    <span style={{ color: "#27ae60", fontWeight: "bold" }}>
                      Stok: {formatAngka(stokTersedia)}
                    </span>
                    <span
                      style={{
                        color: kekurangan > 0 ? "#e74c3c" : "#27ae60",
                        fontWeight: "bold",
                        backgroundColor:
                          kekurangan > 0 ? "#ffeaa7" : "transparent",
                        padding: "1px 4px",
                        borderRadius: "2px",
                      }}
                    >
                      {kekurangan > 0
                        ? `Kurang: ${formatAngka(kekurangan)}`
                        : "Stok Cukup"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {terbuka && punyaAnak && (
          <div>
            {node.children!.map((child, index) => (
              <ItemPohon
                key={`${child.TransID}-${child.ItemID}-${index}`}
                node={child}
                nodeTerbuka={nodeTerbuka}
                onToggle={onToggle}
                pencarian={pencarian}
                jumlahProduksi={jumlahProduksi}
                tampilkanKebutuhan={tampilkanKebutuhan}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        border: "1px solid #dee2e6",
        borderRadius: "5px",
        overflow: "hidden",
      }}
    >
      {/* Kontrol Pohon */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={bukaSemua}
            style={{
              padding: "6px 12px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Buka Semua
          </button>
          <button
            onClick={tutupSemua}
            style={{
              padding: "6px 12px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Tutup Semua
          </button>
          <div
            style={{
              fontSize: "12px",
              color: "#495057",
              backgroundColor: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #dee2e6",
            }}
          >
            Level: 0-{statistikPohon.levelTertinggi}
          </div>
          {tampilkanKebutuhan && (
            <div
              style={{
                fontSize: "12px",
                color: "#e74c3c",
                backgroundColor: "#ffeaa7",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #fdcb6e",
                fontWeight: "bold",
              }}
            >
              Jumlah Produksi: {formatAngka(jumlahProduksi)}
            </div>
          )}
        </div>

        <div style={{ position: "relative", minWidth: "250px" }}>
          <input
            type="text"
            placeholder="Cari bahan..."
            value={pencarian}
            onChange={(e) => setPencarian(e.target.value)}
            style={{
              padding: "8px 12px 8px 35px",
              border: "1px solid #ced4da",
              borderRadius: "4px",
              width: "100%",
              fontSize: "14px",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
            }}
          >
            🔍
          </span>
          {pencarian && (
            <button
              onClick={() => setPencarian("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Header Pohon */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "#495057",
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <span
            style={{
              fontWeight: "bold",
              marginRight: "10px",
              minWidth: "100px",
            }}
          >
            Kode Bahan
          </span>
          <span style={{ flex: 1 }}>Nama Bahan</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <span
              style={{
                fontWeight: "bold",
                minWidth: "50px",
                textAlign: "right",
              }}
              title="Jumlah per 1 unit produk"
            >
              Per Unit
            </span>
            {tampilkanKebutuhan && (
              <>
                <span
                  style={{
                    fontWeight: "bold",
                    minWidth: "70px",
                    textAlign: "right",
                  }}
                  title="Total Kebutuhan untuk Produksi"
                >
                  Total Butuh
                </span>
                <span
                  style={{
                    fontWeight: "bold",
                    minWidth: "60px",
                    textAlign: "right",
                    color: "#27ae60",
                  }}
                  title="Stok Tersedia"
                >
                  Stok
                </span>
                <span
                  style={{
                    fontWeight: "bold",
                    minWidth: "70px",
                    textAlign: "right",
                  }}
                  title="Kekurangan Stok"
                >
                  Kekurangan
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Isi Pohon */}
      <div style={{ maxHeight: "600px", overflowY: "auto" }}>
        {pohonTersaring.length > 0 ? (
          pohonTersaring.map((node, index) => (
            <ItemPohon
              key={`${node.TransID}-${node.ItemID}-${index}`}
              node={node}
              nodeTerbuka={nodeTerbuka}
              onToggle={toggleNode}
              pencarian={pencarian}
              jumlahProduksi={jumlahProduksi}
              tampilkanKebutuhan={tampilkanKebutuhan}
            />
          ))
        ) : (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}
          >
            Tidak ada bahan yang sesuai dengan pencarian
          </div>
        )}
      </div>

      {/* Footer Pohon */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#e9ecef",
          borderTop: "1px solid #dee2e6",
          fontSize: "12px",
          color: "#6c757d",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <span>Total Bahan: {statistikPohon.totalItem}</span>
        {tampilkanKebutuhan ? (
          <>
            <span>
              Total per Unit: {formatAngka(statistikPohon.totalQuantityDasar)}
            </span>
            <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
              Total Butuh: {formatAngka(statistikPohon.totalKebutuhan)}
            </span>
            <span style={{ color: "#27ae60", fontWeight: "bold" }}>
              Total Stok:{" "}
              {formatAngka(
                statistikPohon.totalKebutuhan - statistikPohon.totalKekurangan
              )}
            </span>
            <span
              style={{
                color:
                  statistikPohon.totalKekurangan > 0 ? "#e74c3c" : "#27ae60",
                fontWeight: "bold",
                backgroundColor:
                  statistikPohon.totalKekurangan > 0
                    ? "#ffeaa7"
                    : "transparent",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              Total Kurang: {formatAngka(statistikPohon.totalKekurangan)}
            </span>
          </>
        ) : (
          <span>
            Total Quantity: {formatAngka(statistikPohon.totalQuantityDasar)}
          </span>
        )}
        <span>Terbuka: {nodeTerbuka.size} item</span>
      </div>
    </div>
  );
};

// ==================== KOMPONEN UTAMA DENGAN INTEGRASI STOK ====================
export default function PerencanaanProduksi() {
  const [data, setData] = useState<DataProduksi[]>([]);
  const [dataStok, setDataStok] = useState<DataStok[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStok, setLoadingStok] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [pencarianGlobal, setPencarianGlobal] = useState("");
  const [modeTampilan, setModeTampilan] = useState<"planning" | "bom">(
    "planning"
  );

  // Ambil data stok dari API
  const ambilDataStok = async () => {
    try {
      setLoadingStok(true);
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];
      const periodeR = "201905";

      const response = await fetch(
        `/api/stock?periodeR=${periodeR}&loc=GUDUT&item=%&tgl=${formattedDate}&company=0&tipestock=0&jenisbarang=3&kategori=BAHAN%20BAKU&minus=0`
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data stok");
      }

      const result = await response.json();
      if (result.data) {
        // Hitung stockAkhir untuk setiap item
        const hitungStockAkhir = (data: any[]) => {
          const stockAkhirMap: { [key: string]: number } = {};
          const uniqueItemsMap: { [key: string]: any } = {};

          data.forEach((item) => {
            const { itemid, totalkgs } = item;
            const total = parseFloat(totalkgs) || 0;

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
            stockAkhir: Math.round(stockAkhirMap[item.itemid] || 0),
          }));
        };

        const dataDenganStock = hitungStockAkhir(result.data);
        setDataStok(dataDenganStock);
      }
    } catch (err) {
      console.error("Error mengambil data stok:", err);
    } finally {
      setLoadingStok(false);
    }
  };

  // Ambil data dari API
  const ambilData = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filter.startDate) params.append("startDate", filter.startDate);
      if (filter.endDate) params.append("endDate", filter.endDate);

      const response = await axios.get<DataOrder[]>(
        `/api/ppic?${params.toString()}`
      );

      const dataProduksi: DataProduksi[] = response.data.map((item) => ({
        ...item,
        expanded: false,
        loadingBom: false,
        bom: undefined,
        errorBom: undefined,
        viewMode: "tree",
      }));

      setData(dataProduksi);
    } catch (err) {
      console.error("Error mengambil data SPK:", err);
      setError("Gagal mengambil data SPK");
    } finally {
      setLoading(false);
    }
  };

  // Ambil data BOM untuk barang tertentu
  const ambilDataBOM = async (kodeBarang: string, index: number) => {
    try {
      setData((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, loadingBom: true, errorBom: undefined }
            : item
        )
      );

      const response = await axios.get<ResponseBOM>(
        `/api/bom/ppic?itemid=${encodeURIComponent(kodeBarang)}`
      );

      setData((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                bom: response.data,
                loadingBom: false,
                expanded: true,
              }
            : item
        )
      );
    } catch (err: any) {
      console.error(`Error mengambil BOM untuk ${kodeBarang}:`, err);
      const errorMessage =
        err.response?.data?.error || "Gagal mengambil data BOM";
      setData((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                loadingBom: false,
                errorBom: errorMessage,
              }
            : item
        )
      );
    }
  };

  // Buka/tutup tampilan BOM
  const toggleBOM = (index: number, kodeBarang: string) => {
    const item = data[index];

    if (item.expanded) {
      setData((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, expanded: false } : item
        )
      );
    } else {
      if (!item.bom && !item.loadingBom) {
        ambilDataBOM(kodeBarang, index);
      } else {
        setData((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, expanded: true } : item
          )
        );
      }
    }
  };

  // Ganti mode tampilan (tree/flat)
  const toggleModeTampilan = (index: number) => {
    setData((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              viewMode: item.viewMode === "flat" ? "tree" : "flat",
            }
          : item
      )
    );
  };

  // Handler perubahan filter
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ambilData();
  };

  // Cari stok untuk item tertentu
  const cariStok = (itemId: string): number => {
    const stokItem = dataStok.find((stok) => stok.itemid === itemId);
    return stokItem ? stokItem.stockAkhir : 0;
  };

  // Tampilkan BOM dalam bentuk tabel sederhana dengan informasi stok
  const tampilkanBOMTable = (bom: DataBahan[], jumlahProduksi: number) => {
    if (!bom || !Array.isArray(bom) || bom.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          Tidak ada data BOM
        </div>
      );
    }

    return (
      <div
        style={{
          border: "1px solid #dee2e6",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#495057", color: "white" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Level</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Kode Bahan</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Nama Bahan</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Per Unit</th>
              {modeTampilan === "planning" && (
                <>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      backgroundColor: "#e74c3c",
                    }}
                  >
                    Total Butuh
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      backgroundColor: "#27ae60",
                    }}
                  >
                    Stok Tersedia
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      backgroundColor: "#f39c12",
                    }}
                  >
                    Kekurangan
                  </th>
                </>
              )}
              <th style={{ padding: "10px", textAlign: "left" }}>Departemen</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Jenis</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((item, index) => {
              const kebutuhan = item.Qty * jumlahProduksi;
              const stokTersedia = cariStok(item.ItemID);
              const kekurangan = Math.max(0, kebutuhan - stokTersedia);

              return (
                <tr
                  key={`${item.TransID}-${index}`}
                  style={{
                    borderBottom: "1px solid #dee2e6",
                    backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                  }}
                >
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {item.Level}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      fontFamily: "monospace",
                      fontWeight: "bold",
                    }}
                  >
                    {item.ItemID || "N/A"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {item.ItemName || "No Name"}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatAngka(item.Qty)}
                  </td>
                  {modeTampilan === "planning" && (
                    <>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#e74c3c",
                          fontWeight: "bold",
                          backgroundColor: "rgba(231, 76, 60, 0.1)",
                        }}
                      >
                        ⚡{formatAngka(kebutuhan)}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#27ae60",
                          fontWeight: "bold",
                          backgroundColor: "rgba(39, 174, 96, 0.1)",
                        }}
                      >
                        📦{formatAngka(stokTersedia)}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: kekurangan > 0 ? "#e74c3c" : "#27ae60",
                          fontWeight: "bold",
                          backgroundColor:
                            kekurangan > 0
                              ? "rgba(243, 156, 18, 0.1)"
                              : "rgba(39, 174, 96, 0.1)",
                        }}
                      >
                        {kekurangan > 0 ? "❌" : "✅"}
                        {formatAngka(kekurangan)}
                      </td>
                    </>
                  )}
                  <td style={{ padding: "10px" }}>{item.Departemen || "-"}</td>
                  <td style={{ padding: "10px" }}>{item.NamaJenis || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Hitung total kebutuhan bahan dengan stok
  const hitungTotalKebutuhanDenganStok = (
    bom: ResponseBOM | undefined,
    jumlahProduksi: number
  ) => {
    if (!bom?.flat || !Array.isArray(bom.flat)) {
      return { totalKebutuhan: 0, totalKekurangan: 0, totalStokCukup: 0 };
    }

    let totalKebutuhan = 0;
    let totalKekurangan = 0;
    let totalStokCukup = 0;

    bom.flat.forEach((item) => {
      const kebutuhan = pastikanAngka(item.Qty) * jumlahProduksi;
      const stokTersedia = cariStok(item.ItemID);
      const kekurangan = Math.max(0, kebutuhan - stokTersedia);

      totalKebutuhan += kebutuhan;
      totalKekurangan += kekurangan;
      if (kekurangan === 0) {
        totalStokCukup++;
      }
    });

    return {
      totalKebutuhan,
      totalKekurangan,
      totalStokCukup,
      totalItem: bom.flat.length,
    };
  };

  // Hitung total quantity dasar
  const hitungTotalDasar = (bom: ResponseBOM | undefined): number => {
    if (!bom?.flat || !Array.isArray(bom.flat)) return 0;
    return bom.flat.reduce((total, item) => total + pastikanAngka(item.Qty), 0);
  };

  // Hitung statistik pohon
  const hitungStatistikPohon = (bom: ResponseBOM | undefined) => {
    if (!bom?.flat) return { totalItems: 0, maxLevel: 0 };

    const totalItems = bom.flat.length;
    const maxLevel = Math.max(...bom.flat.map((item) => item.Level));

    return {
      totalItems,
      maxLevel,
    };
  };

  // Tampilkan ringkasan produksi dengan informasi stok
  const tampilkanRingkasanProduksi = (item: DataProduksi) => {
    if (!item.bom) return null;

    const totalDasar = hitungTotalDasar(item.bom);
    const { totalKebutuhan, totalKekurangan, totalStokCukup, totalItem } =
      hitungTotalKebutuhanDenganStok(item.bom, pastikanAngka(item.QTY));

    const persentaseStokCukup =
      totalItem > 0 ? (totalStokCukup / totalItem) * 100 : 0;

    return (
      <div
        style={{
          backgroundColor: totalKekurangan > 0 ? "#fff3cd" : "#d4edda",
          border:
            totalKekurangan > 0 ? "1px solid #ffeaa7" : "1px solid #c3e6cb",
          borderRadius: "4px",
          padding: "15px",
          marginBottom: "15px",
        }}
      >
        <h4
          style={{
            margin: "0 0 10px 0",
            color: totalKekurangan > 0 ? "#856404" : "#155724",
          }}
        >
          📊 Ringkasan Perencanaan Produksi
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            <strong>Order Produksi:</strong> {item.No_SPK}
          </div>
          <div>
            <strong>Produk:</strong> {item.Kode_Barang}
          </div>
          <div>
            <strong>Jumlah Produksi:</strong> {formatAngka(item.QTY)} unit
          </div>
          <div>
            <strong>Total Bahan Baku:</strong> {totalItem}
          </div>
          <div>
            <strong>Total per Unit:</strong> {formatAngka(totalDasar)}
          </div>
          <div style={{ color: "#e74c3c", fontWeight: "bold" }}>
            <strong>Total Kebutuhan:</strong> {formatAngka(totalKebutuhan)}
          </div>
          <div
            style={{
              color: totalKekurangan > 0 ? "#e74c3c" : "#27ae60",
              fontWeight: "bold",
              backgroundColor: totalKekurangan > 0 ? "#ffeaa7" : "transparent",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            <strong>Total Kekurangan:</strong> {formatAngka(totalKekurangan)}
          </div>
          <div
            style={{
              color: persentaseStokCukup === 100 ? "#27ae60" : "#f39c12",
              fontWeight: "bold",
            }}
          >
            <strong>Stok Cukup:</strong> {totalStokCukup} dari {totalItem} (
            {persentaseStokCukup.toFixed(1)}%)
          </div>
        </div>
        {totalKekurangan > 0 && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              color: "#721c24",
            }}
          >
            ⚠️ <strong>Peringatan:</strong> Ada kekurangan stok untuk{" "}
            {totalItem - totalStokCukup} bahan. Harap lakukan pembelian terlebih
            dahulu.
          </div>
        )}
      </div>
    );
  };

  // Filter data berdasarkan pencarian global
  const dataTersaring = useMemo(() => {
    if (!pencarianGlobal.trim()) return data;

    return data.filter(
      (item) =>
        item.No_SPK.toLowerCase().includes(pencarianGlobal.toLowerCase()) ||
        item.Nama_PO.toLowerCase().includes(pencarianGlobal.toLowerCase()) ||
        item.Kode_Barang.toLowerCase().includes(
          pencarianGlobal.toLowerCase()
        ) ||
        item.Tanggal_Order.toLowerCase().includes(pencarianGlobal.toLowerCase())
    );
  }, [data, pencarianGlobal]);

  // Ambil data saat komponen pertama kali dimuat
  useEffect(() => {
    ambilData();
    ambilDataStok();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ color: "#2c3e50", margin: 0 }}>
          🏭 Sistem Perencanaan Produksi dengan Stok
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setModeTampilan("planning")}
            style={{
              padding: "8px 16px",
              backgroundColor:
                modeTampilan === "planning" ? "#e74c3c" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            📋 Perencanaan Produksi
          </button>
          <button
            onClick={() => setModeTampilan("bom")}
            style={{
              padding: "8px 16px",
              backgroundColor: modeTampilan === "bom" ? "#3498db" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔧 View BOM
          </button>
        </div>
      </div>

      {/* Status Loading Stok */}
      {loadingStok && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: "4px",
            marginBottom: "15px",
            color: "#0c5460",
          }}
        >
          🔄 Memuat data stok...
        </div>
      )}

      {/* Pencarian Global */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Cari SPK, PO, Kode Barang..."
            value={pencarianGlobal}
            onChange={(e) => setPencarianGlobal(e.target.value)}
            style={{
              padding: "10px 15px 10px 40px",
              border: "1px solid #ddd",
              borderRadius: "25px",
              width: "100%",
              fontSize: "16px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
              fontSize: "18px",
            }}
          >
            🔍
          </span>
          {pencarianGlobal && (
            <button
              onClick={() => setPencarianGlobal("")}
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6c757d",
                fontSize: "18px",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Form Filter */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "center",
            flexWrap: "wrap",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "5px",
          }}
        >
          <div>
            <label style={{ marginRight: "5px", fontWeight: "bold" }}>
              Tanggal Mulai:
            </label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>
          <div>
            <label style={{ marginRight: "5px", fontWeight: "bold" }}>
              Tanggal Akhir:
            </label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 20px",
              backgroundColor: loading ? "#95a5a6" : "#3498db",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Memuat..." : "Tampilkan Data"}
          </button>
          <button
            type="button"
            onClick={ambilDataStok}
            disabled={loadingStok}
            style={{
              padding: "8px 20px",
              backgroundColor: loadingStok ? "#95a5a6" : "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loadingStok ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loadingStok ? "Memuat Stok..." : "🔄 Update Stok"}
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            color: "#721c24",
            padding: "12px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            marginBottom: "15px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {dataTersaring.length > 0 ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#2c3e50", color: "white" }}>
                <th
                  style={{
                    padding: "12px",
                    width: "50px",
                    textAlign: "center",
                  }}
                ></th>
                <th style={{ padding: "12px", textAlign: "left" }}>No SPK</th>
                <th style={{ padding: "12px", textAlign: "left" }}>
                  Tanggal Order
                </th>
                <th style={{ padding: "12px", textAlign: "left" }}>Nama PO</th>
                <th style={{ padding: "12px", textAlign: "left" }}>
                  Kode Barang
                </th>
                <th style={{ padding: "12px", textAlign: "right" }}>QTY SPK</th>
                {modeTampilan === "planning" && (
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      backgroundColor: "#e74c3c",
                    }}
                  >
                    Production Planning
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {dataTersaring.map((item, index) => {
                const stats = hitungStatistikPohon(item.bom);
                const jumlahProduksi = pastikanAngka(item.QTY);
                const { totalKekurangan } = item.bom
                  ? hitungTotalKebutuhanDenganStok(item.bom, jumlahProduksi)
                  : { totalKekurangan: 0 };

                return (
                  <>
                    <tr
                      key={index}
                      style={{
                        backgroundColor: item.expanded
                          ? "#e8f4fd"
                          : index % 2 === 0
                          ? "#f8f9fa"
                          : "white",
                        borderBottom: "1px solid #dee2e6",
                      }}
                    >
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => toggleBOM(index, item.Kode_Barang)}
                          disabled={item.loadingBom}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: item.loadingBom ? "not-allowed" : "pointer",
                            fontSize: "16px",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            backgroundColor: item.expanded
                              ? "#e74c3c"
                              : "#3498db",
                            color: "white",
                          }}
                          title={
                            item.expanded ? "Sembunyikan BOM" : "Tampilkan BOM"
                          }
                        >
                          {item.loadingBom ? "⏳" : item.expanded ? "−" : "+"}
                        </button>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>
                        {item.No_SPK || "N/A"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {item.Tanggal_Order || "N/A"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {item.Nama_PO || "N/A"}
                      </td>
                      <td style={{ padding: "12px", fontFamily: "monospace" }}>
                        {item.Kode_Barang || "N/A"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {formatAngka(item.QTY)}
                      </td>
                      {modeTampilan === "planning" && (
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            backgroundColor:
                              totalKekurangan > 0
                                ? "rgba(231, 76, 60, 0.2)"
                                : "rgba(39, 174, 96, 0.2)",
                          }}
                        >
                          <span
                            style={{
                              color:
                                totalKekurangan > 0 ? "#e74c3c" : "#27ae60",
                              fontWeight: "bold",
                            }}
                          >
                            {totalKekurangan > 0
                              ? "⚠️ Ada Kekurangan Stok"
                              : "✅ Stok Cukup"}
                          </span>
                        </td>
                      )}
                    </tr>
                    {item.expanded && (
                      <tr>
                        <td
                          colSpan={modeTampilan === "planning" ? 7 : 6}
                          style={{ padding: "0", backgroundColor: "#f8f9fa" }}
                        >
                          <div
                            style={{
                              padding: "20px",
                              borderTop: "2px solid #3498db",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "15px",
                                flexWrap: "wrap",
                                gap: "10px",
                              }}
                            >
                              <div>
                                <h3 style={{ margin: 0, color: "#2c3e50" }}>
                                  {modeTampilan === "planning"
                                    ? `Perencanaan Produksi - ${item.Kode_Barang}`
                                    : `Struktur Bahan (BOM) - ${item.Kode_Barang}`}
                                </h3>
                                <p
                                  style={{
                                    margin: "5px 0 0 0",
                                    color: "#666",
                                    fontSize: "14px",
                                  }}
                                >
                                  <strong>SPK:</strong> {item.No_SPK} •
                                  <strong> PO:</strong> {item.Nama_PO} •
                                  <strong> Tanggal:</strong>{" "}
                                  {item.Tanggal_Order}
                                </p>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  alignItems: "center",
                                }}
                              >
                                {item.bom && (
                                  <>
                                    <div style={{ textAlign: "right" }}>
                                      <div
                                        style={{
                                          backgroundColor: "#27ae60",
                                          color: "white",
                                          padding: "5px 10px",
                                          borderRadius: "4px",
                                          fontSize: "14px",
                                          marginBottom: "5px",
                                        }}
                                      >
                                        Total Bahan: {stats.totalItems}
                                      </div>
                                      {modeTampilan === "planning" && (
                                        <div
                                          style={{
                                            backgroundColor:
                                              totalKekurangan > 0
                                                ? "#e74c3c"
                                                : "#2980b9",
                                            color: "white",
                                            padding: "5px 10px",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                          }}
                                        >
                                          {totalKekurangan > 0
                                            ? `Kurang: ${formatAngka(
                                                totalKekurangan
                                              )}`
                                            : `Butuh: ${formatAngka(
                                                hitungTotalKebutuhanDenganStok(
                                                  item.bom,
                                                  jumlahProduksi
                                                ).totalKebutuhan
                                              )}`}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => toggleModeTampilan(index)}
                                      style={{
                                        padding: "8px 16px",
                                        backgroundColor:
                                          item.viewMode === "tree"
                                            ? "#6c757d"
                                            : "#17a2b8",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {item.viewMode === "tree"
                                        ? "Tampilan Table"
                                        : "Tampilan Pohon"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {item.loadingBom ? (
                              <div
                                style={{
                                  padding: "40px",
                                  textAlign: "center",
                                  color: "#6c757d",
                                }}
                              >
                                <div>Memuat data BOM...</div>
                              </div>
                            ) : item.errorBom ? (
                              <div
                                style={{
                                  padding: "20px",
                                  textAlign: "center",
                                  color: "#dc3545",
                                  backgroundColor: "#f8d7da",
                                  border: "1px solid #f5c6cb",
                                  borderRadius: "4px",
                                }}
                              >
                                <div>Error: {item.errorBom}</div>
                              </div>
                            ) : item.bom ? (
                              <>
                                {modeTampilan === "planning" &&
                                  tampilkanRingkasanProduksi(item)}
                                {item.viewMode === "tree" ? (
                                  <PohonBOM
                                    dataPohon={item.bom.tree}
                                    jumlahProduksi={jumlahProduksi}
                                    dataStok={dataStok}
                                    tampilkanKebutuhan={
                                      modeTampilan === "planning"
                                    }
                                  />
                                ) : (
                                  tampilkanBOMTable(
                                    item.bom.flat,
                                    jumlahProduksi
                                  )
                                )}
                              </>
                            ) : (
                              <div
                                style={{
                                  padding: "40px",
                                  textAlign: "center",
                                  color: "#6c757d",
                                  border: "2px dashed #dee2e6",
                                  borderRadius: "5px",
                                }}
                              >
                                <div>
                                  Tidak ada data BOM tersedia untuk item ini
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#6c757d",
              border: "2px dashed #dee2e6",
              borderRadius: "5px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>
              {pencarianGlobal
                ? "Tidak ada data yang sesuai dengan pencarian"
                : "Tidak ada data perencanaan produksi"}
            </h3>
            <p>
              {pencarianGlobal
                ? "Coba dengan kata kunci lain"
                : "Silakan pilih tanggal filter untuk menampilkan data"}
            </p>
          </div>
        )
      )}

      {loading && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            border: "1px solid #dee2e6",
            borderRadius: "5px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>
            Memuat data perencanaan produksi...
          </div>
          <div style={{ color: "#6c757d" }}>Harap tunggu sebentar</div>
        </div>
      )}
    </div>
  );
}
