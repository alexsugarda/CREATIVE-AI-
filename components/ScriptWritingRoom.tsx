
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface ScriptWritingRoomProps {
    project: Project;
    isGenerating: boolean;
    onContinue: () => void;
    onFinalize: () => void;
    onBack: () => void;
    onGenerateTts: () => void;
    isGeneratingTts: boolean;
}

const ScriptWritingRoom: React.FC<ScriptWritingRoomProps> = ({ 
    project, 
    isGenerating, 
    onContinue, 
    onFinalize, 
    onBack, 
    onGenerateTts, 
    isGeneratingTts 
}) => {
    const { script, duration, ttsScript } = project;
    const [activeTab, setActiveTab] = useState<'main' | 'tts'>('main');
    const { showNotification } = useNotification();
    
    const fullScriptText = script.join('\n\n');
    const currentWordCount = fullScriptText.split(/\s+/).filter(Boolean).length;
    const averageWordsPerMinute = 140;
    const currentDuration = Math.round(currentWordCount / averageWordsPerMinute);
    const isTargetReached = currentDuration >= duration;

    useEffect(() => {
        if (activeTab === 'tts' && !ttsScript && !isGeneratingTts) {
            onGenerateTts();
        }
    }, [activeTab, ttsScript, isGeneratingTts, onGenerateTts]);

    const handleCopyTtsScript = () => {
        if (!ttsScript) return;
        navigator.clipboard.writeText(ttsScript)
            .then(() => {
                showNotification('Naskah SSML TTS berhasil disalin!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy TTS script:', err);
                showNotification('Gagal menyalin naskah.', 'error');
            });
    };

    const renderScriptContent = () => {
        if (activeTab === 'main') {
            if (script.length === 0) {
                 return (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-brand-gray-400">Naskah sedang dibuat...</p>
                    </div>
                );
            }
            return (
                <div className="space-y-4">
                    {script.map((chunk, index) => (
                        <div key={index} className="bg-brand-gray-800 border border-brand-gray-700/50 rounded-lg p-4">
                             <p className="text-xs font-bold uppercase text-brand-purple mb-2">Episode {index * 3 + 1} - {index * 3 + 3}</p>
                             <pre className="whitespace-pre-wrap font-sans text-brand-gray-200">{chunk}</pre>
                        </div>
                    ))}
                </div>
            )
        }
        
        if (activeTab === 'tts') {
            if (isGeneratingTts) {
                 return (
                     <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="animate-spin mx-auto h-8 w-8 text-brand-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-2 text-brand-gray-400">Membuat naskah audio SSML...</p>
                        </div>
                    </div>
                );
            }
            return <pre className="whitespace-pre-wrap font-mono text-sm text-brand-gray-300">{ttsScript}</pre>;
        }
    };


    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-display mb-2 text-center">Ruang Penulisan Naskah</h2>
            <p className="text-lg text-brand-gray-300 mb-8 text-center">
                AI akan menulis cerita Anda secara bertahap. Tambahkan episode hingga durasi target tercapai.
            </p>

            <div className="bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-8 mb-6 shadow-2xl shadow-brand-purple/10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex border-b border-brand-gray-700 items-center">
                             <button
                                onClick={() => setActiveTab('main')}
                                className={`px-4 py-2 font-semibold transition-colors duration-300 ${activeTab === 'main' ? 'text-white border-b-2 border-brand-purple' : 'text-brand-gray-400'}`}
                            >
                                Naskah Utama
                            </button>
                            <button
                                onClick={() => setActiveTab('tts')}
                                className={`px-4 py-2 font-semibold transition-colors duration-300 ${activeTab === 'tts' ? 'text-white border-b-2 border-brand-purple' : 'text-brand-gray-400'}`}
                            >
                                Naskah Text-to-Speech
                            </button>
                             {activeTab === 'tts' && ttsScript && !isGeneratingTts && (
                                <button 
                                    onClick={handleCopyTtsScript}
                                    className="ml-4 text-xs py-1 px-3 bg-brand-gray-700 rounded-md hover:bg-brand-gray-600 transition-colors flex items-center gap-1"
                                    aria-label="Salin Naskah TTS"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Salin
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-white">{currentDuration} / {duration} menit</p>
                        <p className="text-sm text-brand-gray-400">Estimasi Durasi</p>
                    </div>
                </div>
                <div className="w-full bg-brand-gray-700 rounded-full h-2.5 mb-4">
                    <div className="bg-gradient-to-r from-brand-pink to-brand-purple h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (currentDuration / duration) * 100)}%` }}></div>
                </div>
                <div className="w-full h-[50vh] p-4 bg-brand-gray-900 border-2 border-brand-gray-700 rounded-lg overflow-y-auto">
                    {renderScriptContent()}
                </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
                {!isTargetReached && (
                    <button
                        onClick={onContinue}
                        disabled={isGenerating}
                        className="w-full max-w-sm py-4 px-6 bg-brand-gray-700 text-white font-bold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center text-xl"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menulis Lanjutan...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Tambah 3 Episode Berikutnya
                            </>
                        )}
                    </button>
                )}
                 <button
                    onClick={onFinalize}
                    disabled={isGenerating}
                    className="w-full max-w-sm py-4 px-6 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 text-xl"
                >
                    {isTargetReached ? 'Finalisasi & Lanjutkan ke Karakter' : 'Finalisasi Naskah Sekarang'}
                </button>
            </div>
             <div className="mt-8 flex justify-center">
                 <button
                    onClick={onBack}
                    className="py-2 px-6 bg-transparent text-brand-gray-400 font-semibold rounded-lg hover:bg-brand-gray-800 transition-colors duration-300"
                >
                    Kembali & Ganti Judul
                </button>
            </div>
        </div>
    );
};

export default ScriptWritingRoom;