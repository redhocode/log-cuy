import { ClockLoader } from "react-spinners";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return(
    <div className="flex flex-col items-center justify-center min-h-screen">
        <ClockLoader 
        size={100}
        />;

    </div>
  ) 
  
}
