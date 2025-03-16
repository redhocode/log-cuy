import { HashLoader } from "react-spinners";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex items-center justify-center min-h-screen flex-col">
      <HashLoader size={200} />;
      <pre className="text-2xl">
      Memuat Data
      </pre>
    </div>
  ); 
  
}
