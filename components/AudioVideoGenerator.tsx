
import React from 'react';
import { Scene, AudioRecommendations } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface AudioVideoGeneratorProps {
    scenes: Scene[];
    audioRecommendations: AudioRecommendations | null;
    onBack: () => void;
    onFinalize: () => void;
    onRegenerateRecommendations: () => void;
    isRegeneratingAudio?: boolean;
}

const AudioVideoGenerator: React.FC<AudioVideoGeneratorProps> = ({ scenes, audioRecommendations, onBack, onFinalize, onRegenerateRecommendations, isRegeneratingAudio }) => {
    const { showNotification } = useNotification();

    const handleCopy = (text: string, message: string = 'Rekomendasi disalin!') => {
        navigator.clipboard.writeText(text)
            .then(() => showNotification(message, 'success'))
            .catch(() => showNotification('Gagal menyalin.', 'error'));
    };

    const handleDownloadSrt = () => {
        let srtContent = '';
        let startTime = 0; // in seconds
        let counter = 1;
        
        const allShots = scenes.flatMap(scene => scene.shots);

        allShots.forEach((shot) => {
            const narrationDuration = Math.max(2, shot.narration.length / 15); // Simple calculation
            const endTime = startTime + narrationDuration;

            const formatTime = (totalSeconds: number) => {
                const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
                const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
                const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000).toString().padStart(3, '0');
                return `${hours}:${minutes}:${seconds},${milliseconds}`;
            };

            srtContent += `${counter}\n`;
            srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
            srtContent += `${shot.narration}\n\n`;

            startTime = endTime + 0.5; // 0.5s pause between shots
            counter++;
        });

        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'subtitles.srt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleDownloadAudio = () => {
        // This is a simulation. In a real app, this would trigger TTS API.
        const blob = new Blob(["Audio generation is a placeholder in this environment."], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'narration_placeholder.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in w-full max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-display mb-8 text-center">Pusat Aset Audio</h2>
            
            <div className="bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-8 space-y-8">
                
                <div>
                    <h3 className="text-xl font-bold font-display text-brand-purple mb-4">1. Narasi & Subtitle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div>
                            <label className="text-sm font-semibold text-brand-gray-300 block mb-2">Gaya Suara Narator</label>
                            <select className="w-full p-2 bg-brand-gray-800 border border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none">
                                <option>Suara Pria Dewasa (Indonesia)</option>
                                <option>Suara Wanita Muda (Indonesia)</option>
                                <option>Male Adult Voice (English)</option>
                                <option>Female Young Voice (English)</option>
                            </select>
                        </div>
                        <button onClick={() => { handleDownloadAudio(); handleDownloadSrt(); }} className="w-full py-2 px-4 bg-brand-purple text-white font-semibold rounded-lg hover:bg-opacity-90 transition-opacity">
                            Buat & Unduh Aset Audio (.mp3 & .srt)
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold font-display text-brand-purple">2. Rekomendasi Audio (dari AI)</h3>
                        <button 
                            onClick={onRegenerateRecommendations} 
                            disabled={isRegeneratingAudio}
                            className="flex items-center text-sm py-2 px-4 bg-brand-gray-700 rounded-lg hover:bg-brand-gray-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isRegeneratingAudio ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Membuat...
                                </>
                            ) : "Buat Ulang Rekomendasi"}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-base font-semibold text-brand-gray-300 mb-2">Prompt Musik Latar (BGM)</h4>
                            <ul className="list-disc list-inside bg-brand-gray-900 p-4 rounded-lg space-y-2 text-brand-gray-300 min-h-[100px]">
                                {audioRecommendations?.bgm && audioRecommendations.bgm.length > 0 ? (
                                    audioRecommendations.bgm.map((rec, i) => (
                                        <li key={`bgm-${i}`} className="flex justify-between items-center">
                                            <span>{rec}</span>
                                            <button onClick={() => handleCopy(rec)} className="text-xs py-1 px-2 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors ml-2 flex-shrink-0">Salin</button>
                                        </li>
                                    ))
                                ) : (
                                    <li>Tidak ada rekomendasi.</li>
                                )}
                            </ul>
                        </div>
                         <div>
                            <h4 className="text-base font-semibold text-brand-gray-300 mb-2">Prompt Efek Suara (SFX)</h4>
                            <ul className="list-disc list-inside bg-brand-gray-900 p-4 rounded-lg space-y-2 text-brand-gray-300 min-h-[100px]">
                                {audioRecommendations?.sfx && audioRecommendations.sfx.length > 0 ? (
                                    audioRecommendations.sfx.map((rec, i) => (
                                        <li key={`sfx-${i}`} className="flex justify-between items-center">
                                            <span>{rec}</span>
                                            <button onClick={() => handleCopy(rec)} className="text-xs py-1 px-2 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors ml-2 flex-shrink-0">Salin</button>
                                        </li>
                                    ))
                                ) : (
                                    <li>Tidak ada rekomendasi.</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-brand-gray-300 mb-2">Saran Kata Kunci Pencarian (BGM)</h4>
                             <div className="bg-brand-gray-900 p-4 rounded-lg flex flex-wrap gap-2">
                                {audioRecommendations?.bgmKeywords && audioRecommendations.bgmKeywords.length > 0 ? (
                                    audioRecommendations.bgmKeywords.map((keyword, i) => (
                                        <button key={`bgm-kw-${i}`} onClick={() => handleCopy(keyword, 'Kata kunci disalin!')} className="text-sm py-1 px-3 bg-brand-gray-700 rounded-full hover:bg-brand-gray-600 transition-colors">
                                            {keyword}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-brand-gray-500">Tidak ada kata kunci.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-brand-gray-300 mb-2">Saran Kata Kunci Pencarian (SFX)</h4>
                            <div className="bg-brand-gray-900 p-4 rounded-lg flex flex-wrap gap-2">
                                {audioRecommendations?.sfxKeywords && audioRecommendations.sfxKeywords.length > 0 ? (
                                    audioRecommendations.sfxKeywords.map((keyword, i) => (
                                         <button key={`sfx-kw-${i}`} onClick={() => handleCopy(keyword, 'Kata kunci disalin!')} className="text-sm py-1 px-3 bg-brand-gray-700 rounded-full hover:bg-brand-gray-600 transition-colors">
                                            {keyword}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-brand-gray-500">Tidak ada kata kunci.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold font-display text-brand-purple mb-4">3. Cari & Unggah Audio</h3>
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        <a href="https://pixabay.com/music/" target="_blank" rel="noopener noreferrer" className="py-2 px-4 bg-brand-gray-700 text-white font-semibold rounded-lg hover:bg-brand-gray-600 transition-colors">
                            Jelajahi Musik di Pixabay
                        </a>
                        <a href="https://freesound.org/" target="_blank" rel="noopener noreferrer" className="py-2 px-4 bg-brand-gray-700 text-white font-semibold rounded-lg hover:bg-brand-gray-600 transition-colors">
                            Cari SFX di Freesound
                        </a>
                    </div>
                     <label htmlFor="music-upload" className="text-sm text-brand-gray-300">Pilih file musik latar (.mp3) untuk video Anda.</label>
                     <input type="file" id="music-upload" accept="audio/mp3" className="mt-2 w-full text-sm text-brand-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-opacity-90"/>
                </div>
            </div>
            
            <div className="mt-8 flex justify-center space-x-4">
                <button
                    onClick={onBack}
                    className="py-3 px-8 bg-brand-gray-700 text-white font-bold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300 text-lg"
                >
                    Kembali ke Adegan
                </button>
                <button
                    onClick={onFinalize}
                    className="py-3 px-8 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg"
                >
                    Lanjutkan ke Pembuatan Video
                </button>
            </div>
        </div>
    );
};

export default AudioVideoGenerator;