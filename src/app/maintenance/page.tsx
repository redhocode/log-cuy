"use client"; // This makes the component a Client Component

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";

export default function Maintenance() {
  const [message, setMessage] = useState(""); // State to store the input value

  const handleContactDeveloper = () => {
    const encodedMessage = encodeURIComponent(message); // URL encode the message
    const phoneNumber = "62895327504234"; // Replace with the developer's WhatsApp number
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(url, "_blank"); // Open WhatsApp in a new tab
  };

  return (
    <div className="flex justify-center flex-col items-center mt-20 bg-slate-200 pt-10 pb-10">
      <Image src="/img/main.png" alt="maintenance" width={400} height={400} />
      <h1 className="text-5xl font-bold mt-5 text-[#4D4D61]">
        Sistem di kunci karna status IT tidak ada kejelasan!!
      </h1>
      <Input
        className="mt-5 w-1/2"
        placeholder="Silahkan tulis pesan Anda"
        value={message}
        onChange={(e) => setMessage(e.target.value)} // Update the message as the user types
      />
      <Button className="mt-5" onClick={handleContactDeveloper}>
        Kirim Ke Developer
      </Button>
    </div>
  );
}
