import { HashLoader } from "react-spinners";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex items-center justify-center min-h-screen">
      <HashLoader size={200} />;
    </div>
  ); 
  
}
