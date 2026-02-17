'use client'; // Penting karena menggunakan useState dan useEffect

import Link from 'next/link';
import { useEffect, useState } from 'react';

const FloatingTelegram = () => {
  const telegramLink = 'https://t.me/+gkN5x_knR_oyNDZl#'; // Ganti dengan link group-mu
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Munculkan tooltip otomatis setelah 2 detik
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2000);

    // Sembunyikan tooltip setelah 7 detik (5 detik setelah muncul)
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <Link
        href={telegramLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-all duration-300 hover:scale-110 relative"
        aria-label="Chat on Telegram"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.534.26l.188-2.98 5.424-4.9c.236-.21-.052-.327-.366-.117l-6.704 4.223-2.884-.962c-.628-.197-.64-.628.13-.93l11.27-4.34c.523-.195.98.129.81.724z" />
        </svg>
      </Link>

      {/* Tooltip dengan animasi */}
      <div
        className={`
          absolute bottom-16 right-0 bg-gray-800 text-white text-sm rounded-lg py-2 px-4 whitespace-nowrap shadow-lg
          transition-all duration-300
          ${
            showTooltip
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0'
          }
        `}
      >
        🔥 Cara cepat dapat data, chat di sini
        {/* Panah tooltip */}
        <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-800"></div>
      </div>
    </div>
  );
};

export default FloatingTelegram;