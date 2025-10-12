// components/QrScanner.tsx
"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

interface Props {
  onScan: (data: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        console.log("✅ QR scanned:", decodedText);
        onScan(decodedText); // Kirim hasil ke parent
        scanner.clear(); // stop scanning setelah dapat
      },
      () => {
        // bisa abaikan error kecil
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return <div id="reader" className="w-full max-w-md mx-auto" />;
}
