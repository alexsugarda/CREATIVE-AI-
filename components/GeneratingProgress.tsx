
import React, { useState, useEffect } from 'react';

const messages = [
    "Merangkai narasi yang sempurna...",
    "Menganalisis alur cerita utama...",
    "Membuat adegan deskriptif...",
    "Membangun lini masa visual...",
    "Hampir selesai, keajaiban sedang terjadi!",
];

interface GeneratingProgressProps {
    customMessage?: string;
}

const GeneratingProgress: React.FC<GeneratingProgressProps> = ({ customMessage }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!customMessage) {
            const interval = setInterval(() => {
                setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [customMessage]);

    return (
        <div className="flex flex-col items-center justify-center text-center h-96 animate-fade-in">
             <div className="w-16 h-16 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-3xl font-bold font-display mb-4">{customMessage || "Cerita Anda Sedang Dibuat..."}</h2>
            {!customMessage && (
                <p className="text-lg text-brand-gray-300 transition-opacity duration-500">
                    {messages[messageIndex]}
                </p>
            )}
        </div>
    );
};

export default GeneratingProgress;
