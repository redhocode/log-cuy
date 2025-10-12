// components/GenerateQrCode.tsx
"use client";

import { QRCodeCanvas } from "qrcode.react";

interface Props {
  itemName: string;
  size?: number;
}

export default function GenerateQrCode({ itemName, size = 120 }: Props) {
  return (
    <div className="flex flex-col items-center text-center">
      <QRCodeCanvas
        value={itemName}
        size={size}
        level="H"
        includeMargin={true}
      />
      <div className="text-[10px] mt-1 break-words max-w-[120px]">
        {itemName}
      </div>
    </div>
  );
}
