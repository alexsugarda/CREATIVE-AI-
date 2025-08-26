
import React, { useState, useEffect } from 'react';
import { AiProvider, ApiSettings } from '../types';

interface ApiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: ApiSettings;
    onSave: (settings: ApiSettings) => void;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
    const [activeProvider, setActiveProvider] = useState<AiProvider>(currentSettings.provider);
    const [keys, setKeys] = useState(currentSettings.keys);

    useEffect(() => {
        setActiveProvider(currentSettings.provider);
        setKeys(currentSettings.keys);
    }, [currentSettings]);

    if (!isOpen) {
        return null;
    }

    const handleKeyChange = (provider: keyof ApiSettings['keys'], value: string) => {
        setKeys(prev => ({ ...prev, [provider]: value }));
    };

    const handleSave = () => {
        onSave({ provider: activeProvider, keys });
    };
    
    const renderProviderContent = () => {
        switch (activeProvider) {
            case 'gemini':
                return (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="gemini-key" className="text-sm font-semibold text-brand-gray-300 block mb-2">Masukkan API Key Google Gemini Anda</label>
                            <input
                                type="password"
                                id="gemini-key"
                                value={keys.gemini}
                                onChange={(e) => handleKeyChange('gemini', e.target.value)}
                                placeholder="API Key Google Gemini"
                                className="w-full p-3 bg-brand-gray-700 border-2 border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all duration-300"
                            />
                        </div>
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-purple hover:underline">
                            Belum punya? Dapatkan dari Google AI Studio
                        </a>
                    </div>
                );
            case 'groq':
                 return (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="groq-key" className="text-sm font-semibold text-brand-gray-300 block mb-2">Masukkan API Key Groq Anda</label>
                            <input
                                type="password"
                                id="groq-key"
                                value={keys.groq}
                                onChange={(e) => handleKeyChange('groq', e.target.value)}
                                placeholder="API Key Groq"
                                className="w-full p-3 bg-brand-gray-700 border-2 border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all duration-300"
                            />
                        </div>
                        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-purple hover:underline">
                            Belum punya? Dapatkan dari Groq Console
                        </a>
                    </div>
                );
            case 'openai':
                 return (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="openai-key" className="text-sm font-semibold text-brand-gray-300 block mb-2">Masukkan API Key OpenAI Anda</label>
                            <input
                                type="password"
                                id="openai-key"
                                value={keys.openai}
                                onChange={(e) => handleKeyChange('openai', e.target.value)}
                                placeholder="API Key OpenAI"
                                className="w-full p-3 bg-brand-gray-700 border-2 border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all duration-300"
                            />
                        </div>
                        <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-purple hover:underline">
                            Belum punya? Dapatkan dari OpenAI Platform
                        </a>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-brand-gray-800 border border-brand-gray-700 rounded-2xl p-8 shadow-2xl shadow-brand-purple/20 w-full max-w-md relative animate-fade-in-down">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-brand-gray-400 hover:text-white"
                    aria-label="Tutup"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <h2 className="text-2xl font-bold font-display mb-6 text-center">Pengaturan API</h2>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-brand-gray-300 block mb-2">Pilih Provider AI Aktif</label>
                    <div className="flex bg-brand-gray-900 border border-brand-gray-700 rounded-lg p-1">
                        <button 
                            onClick={() => setActiveProvider('gemini')}
                            className={`w-1/3 py-2 rounded-md font-semibold transition-colors ${activeProvider === 'gemini' ? 'bg-brand-purple text-white' : 'text-brand-gray-300 hover:bg-brand-gray-700'}`}
                        >
                            Google Gemini
                        </button>
                        <button 
                            onClick={() => setActiveProvider('groq')}
                            className={`w-1/3 py-2 rounded-md font-semibold transition-colors ${activeProvider === 'groq' ? 'bg-brand-purple text-white' : 'text-brand-gray-300 hover:bg-brand-gray-700'}`}
                        >
                            Groq
                        </button>
                        <button 
                            onClick={() => setActiveProvider('openai')}
                            className={`w-1/3 py-2 rounded-md font-semibold transition-colors ${activeProvider === 'openai' ? 'bg-brand-purple text-white' : 'text-brand-gray-300 hover:bg-brand-gray-700'}`}
                        >
                            OpenAI
                        </button>
                    </div>
                </div>

                {renderProviderContent()}

                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        className="w-full py-3 px-6 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg"
                    >
                        Simpan Pengaturan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiSettingsModal;
