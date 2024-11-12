"use client"; // Jika Anda menggunakan komponen klien

// import { useRouter } from "next/router";
import { Button } from "./ui/button"; // Ganti dengan komponen tombol Anda
import { Undo2 } from "lucide-react";
const BackButton: React.FC = () => {
  const handleBack = () => {
    window.history.back();
  };

  return <Button onClick={handleBack}>
    <Undo2 className="mr-2 h-4 w-4" />
    Back</Button>;
};

export default BackButton;