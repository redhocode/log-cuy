// app/page.tsx
import CekKodeLC from "@/components/cekkodelc";
import DataMasterBarangPage from "@/components/master/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Master Data Barang</h1>
        <p className="text-gray-600">
          Kelola data barang dengan kode LC dan Non-LC dalam sistem
        </p>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="master" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="master">Data Master Barang</TabsTrigger>
          <TabsTrigger value="cek-lc">Cek Kode LC</TabsTrigger>
        </TabsList>
        
        <TabsContent value="master">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Data Master Barang
              </CardTitle>
              <CardDescription>
                Kelola seluruh data barang dalam sistem termasuk informasi lengkap dan spesifikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataMasterBarangPage />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cek-lc">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pemeriksaan Kode LC
              </CardTitle>
              <CardDescription>
                Cek dan bandingkan kode barang LC dengan Non-LC untuk memastikan konsistensi data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CekKodeLC />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grid Layout (Alternatif) */}
      {/* <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Data Master Barang
            </CardTitle>
            <CardDescription>
              Kelola seluruh data barang dalam sistem termasuk informasi lengkap dan spesifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataMasterBarangPage />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pemeriksaan Kode LC
            </CardTitle>
            <CardDescription>
              Cek dan bandingkan kode barang LC dengan Non-LC
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <CekKodeLC />
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}