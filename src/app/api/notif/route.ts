/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

interface TelegramResponse {
  ok: boolean;
  result: any;
}

// Export untuk metode HTTP POST
export async function POST(req: NextRequest) {
  const { message } = await req.json(); // Mendapatkan data JSON dari request

  const chatIds = ["904514717"]; // Daftar chat IDs yang ingin dikirimi pesan
  // "6551726602", "5338845190", "6024064758","904514717"
  const token = "7880924007:AAHvKkqrvKA45d6fLM0huUD1-H4O_hRrtW8"; // Ganti dengan token bot Telegram Anda

  const url = `https://api.telegram.org/bot${token}/sendMessage`; // URL API Telegram

  try {
    // Loop untuk mengirim pesan ke setiap chat ID
    for (const chatId of chatIds) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message, // Pesan yang dikirimkan
        }),
      });

      const data: TelegramResponse = await response.json();

      // Jika pengiriman pesan gagal untuk satu chat ID
      if (!data.ok) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to send message to one or more chats",
          },
          { status: 500 }
        );
      }
    }

    // Jika pesan berhasil dikirim ke semua chat ID
    return NextResponse.json(
      { success: true, message: "Message sent to multiple Telegram chats" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error sending message to Telegram" },
      { status: 500 }
    );
  }
}
