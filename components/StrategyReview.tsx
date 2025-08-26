
import React, { useState } from 'react';
import { StoryStrategy } from '../services/geminiService';

interface StrategyReviewProps {
    strategy: StoryStrategy;
    onConfirm: (selectedTitle: string) => void;
    onBack: () => void;
}

const StrategyReview: React.FC<StrategyReviewProps> = ({ strategy, onConfirm, onBack }) => {
    const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-display mb-2 text-center">Strategi Cerita & Pilihan Judul</h2>
            <p className="text-lg text-brand-gray-300 mb-8 text-center">
                AI telah menganalisis ide Anda. Pilih judul yang paling menarik untuk melanjutkan.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-center">
                <div className="bg-brand-gray-800 p-4 rounded-lg border border-brand-gray-700">
                    <h3 className="text-sm font-semibold text-brand-gray-400 uppercase tracking-wider mb-2">Genre</h3>
                    <p className="text-lg font-bold text-white">{strategy.genre}</p>
                </div>
                <div className="bg-brand-gray-800 p-4 rounded-lg border border-brand-gray-700">
                    <h3 className="text-sm font-semibold text-brand-gray-400 uppercase tracking-wider mb-2">Target Audiens</h3>
                    <p className="text-lg font-bold text-white">{strategy.targetAudience}</p>
                </div>
            </div>

            <div className="bg-brand-gray-800 p-6 rounded-lg border border-brand-gray-700 mb-8">
                <h3 className="text-sm font-semibold text-brand-gray-400 uppercase tracking-wider mb-2 text-center">Sinopsis Cerita</h3>
                <div className="h-48 overflow-y-auto pr-2 text-left">
                    <p className="text-base font-medium text-brand-gray-200 whitespace-pre-wrap">{strategy.synopsis}</p>
                </div>
            </div>

            <h3 className="text-2xl font-bold font-display mb-4 text-center">Pilih Judul Viral Anda</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {strategy.titleOptions.map((title, index) => (
                    <button 
                        key={index}
                        onClick={() => setSelectedTitle(title)}
                        className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${selectedTitle === title ? 'bg-brand-purple/20 border-brand-purple' : 'bg-brand-gray-800 border-brand-gray-700 hover:border-brand-purple/50'}`}
                    >
                        <p className="font-semibold">{title}</p>
                    </button>
                ))}
            </div>

            <div className="mt-8 flex justify-center space-x-4">
                <button
                    onClick={onBack}
                    className="py-3 px-8 bg-brand-gray-700 text-white font-bold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300 text-lg"
                >
                    Kembali
                </button>
                <button
                    onClick={() => selectedTitle && onConfirm(selectedTitle)}
                    disabled={!selectedTitle}
                    className="py-3 px-8 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Lanjutkan & Buat Naskah
                </button>
            </div>
        </div>
    );
};

export default StrategyReview;
