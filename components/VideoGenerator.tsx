
import React, { useState } from 'react';
import { Scene, Shot } from '../types';

interface VideoGeneratorProps {
    scenes: Scene[];
    setScenes: (scenes: Scene[]) => void;
    onGenerateVideo: (sceneName: string, shotId: number) => void;
    onBack: () => void;
    onFinalize: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ scenes, setScenes, onGenerateVideo, onBack, onFinalize }) => {
    
    const handleVideoPromptChange = (sceneName: string, shotId: number, lang: 'id' | 'en', newPrompt: string) => {
         const newScenes = scenes.map(scene => {
            if (scene.name === sceneName) {
                return {
                    ...scene,
                    shots: scene.shots.map(shot => {
                        if (shot.id === shotId) {
                             return lang === 'id' ? { ...shot, videoPromptId: newPrompt } : { ...shot, videoPromptEn: newPrompt };
                        }
                        return shot;
                    })
                }
            }
            return scene;
        });
        setScenes(newScenes);
    };

    return (
        <div className="animate-fade-in w-full">
            <h3 className="text-3xl font-bold font-display mb-6 text-center">Buat Video & Kustomisasi Prompt Final</h3>
            <div className="space-y-8">
                {scenes.map((scene) => (
                   <div key={scene.name} className="bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-6">
                        <h4 className="text-xl font-bold font-display text-brand-purple mb-4">{scene.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {scene.shots.map((shot) => (
                                <VideoCard 
                                    key={shot.id} 
                                    sceneName={scene.name}
                                    shot={shot} 
                                    onGenerateVideo={onGenerateVideo} 
                                    onPromptChange={handleVideoPromptChange}
                                />
                            ))}
                        </div>
                   </div>
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
                    onClick={onFinalize}
                    className="py-3 px-8 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg"
                >
                    Lanjutkan ke Metadata
                </button>
            </div>
        </div>
    );
};

interface VideoCardProps {
    shot: Shot;
    sceneName: string;
    onGenerateVideo: (sceneName: string, shotId: number) => void;
    onPromptChange: (sceneName: string, shotId: number, lang: 'id' | 'en', newPrompt: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ shot, sceneName, onGenerateVideo, onPromptChange }) => {
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);
    const [promptLang, setPromptLang] = useState<'id' | 'en'>('en');
    
    return (
        <div className="bg-brand-gray-800 rounded-lg p-4 flex flex-col space-y-4 border border-brand-gray-700">
            <p className="text-sm text-brand-gray-400 font-medium truncate" title={shot.narration}>{`Shot ${shot.id + 1}: ${shot.narration}`}</p>
            
            <div className="aspect-video bg-brand-gray-900 rounded-md flex items-center justify-center overflow-hidden">
                {shot.isGeneratingVideo ? (
                     <div className="text-center p-4">
                        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-brand-gray-400 text-xs mt-2">Membuat video... Proses ini bisa memakan waktu beberapa menit.</p>
                     </div>
                ) : shot.videoUrl ? (
                    <video src={shot.videoUrl} controls className="w-full h-full object-cover"/>
                ) : (
                     shot.imageUrl ? 
                     <img src={shot.imageUrl} alt={shot.narration} className="w-full h-full object-cover opacity-50"/> :
                     <div className="text-brand-gray-500 text-sm">Gambar referensi tidak ada</div>
                )}
            </div>

            <div>
                <button
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    aria-expanded={isPromptExpanded}
                    className="w-full flex justify-between items-center text-left text-sm font-medium text-brand-gray-300 py-2"
                >
                    <span>{isPromptExpanded ? 'Sembunyikan Prompt Video Dinamis' : 'Tampilkan Prompt Video Dinamis'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isPromptExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isPromptExpanded && (
                    <div className="mt-2 space-y-2">
                        <div className="flex border-b border-brand-gray-600">
                             <button onClick={() => setPromptLang('en')} className={`px-4 py-1 text-sm font-medium transition-colors ${promptLang === 'en' ? 'text-white border-b-2 border-brand-purple' : 'text-brand-gray-400 hover:text-white'}`}>
                                English
                            </button>
                            <button onClick={() => setPromptLang('id')} className={`px-4 py-1 text-sm font-medium transition-colors ${promptLang === 'id' ? 'text-white border-b-2 border-brand-purple' : 'text-brand-gray-400 hover:text-white'}`}>
                                Indonesia
                            </button>
                        </div>
                        <div className="pt-2">
                            {promptLang === 'en' ? (
                                <textarea
                                    value={shot.videoPromptEn || ''}
                                    onChange={(e) => onPromptChange(sceneName, shot.id, 'en', e.target.value)}
                                    rows={8}
                                    placeholder="Prompt video (English) akan muncul di sini..."
                                    className="w-full p-2 bg-brand-gray-700 text-sm rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none resize-none"
                                />
                            ) : (
                                <textarea
                                    value={shot.videoPromptId || ''}
                                    onChange={(e) => onPromptChange(sceneName, shot.id, 'id', e.target.value)}
                                    rows={8}
                                    placeholder="Prompt video (Indonesia) akan muncul di sini..."
                                    className="w-full p-2 bg-brand-gray-700 text-sm rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none resize-none"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <button
                onClick={() => onGenerateVideo(sceneName, shot.id)}
                disabled={shot.isGeneratingVideo || !shot.imageUrl}
                className="w-full py-2 px-4 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!shot.imageUrl ? "Buat gambar terlebih dahulu untuk membuat video" : ""}
            >
                {shot.isGeneratingVideo ? 'Membuat...' : shot.videoUrl ? 'Buat Ulang Video' : 'Buat Video'}
            </button>
        </div>
    )
};

export default VideoGenerator;
