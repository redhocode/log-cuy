import DataProduksiPage from "@/components/dataproduksi/page";


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-14">
      <h1>Log Cuy</h1>
     <DataProduksiPage/>
    </div>
  );
}
