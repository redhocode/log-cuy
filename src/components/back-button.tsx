"use client"; // Jika Anda menggunakan komponen klien

// import { useRouter } from "next/router";
import { Button } from "./ui/button"; // Ganti dengan komponen tombol Anda

const BackButton: React.FC = () => {
  const handleBack = () => {
    window.history.back();
  };

  return <Button onClick={handleBack}>Back</Button>;
};

export default BackButton;