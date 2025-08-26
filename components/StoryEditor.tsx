
import React, { useState, useRef } from 'react';
import { Scene, Shot, Project } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface StoryEditorProps {
    project: Project;
    setScenes: (scenes: Scene[]) => void;
    onGenerateImage: (sceneName: string, shotId: number) => void;
    onImageUpload: (sceneName: string, shotId: number, file: File) => void;
    onBack: () => void;
    onProceedToAudio: () => void;
}

const StoryEditor: React.FC<StoryEditorProps> = ({
    project,
    setScenes,
    onGenerateImage,
    onImageUpload,
    onBack,
    onProceedToAudio,
}) => {
    const { scenes } = project;
    const totalShots = scenes.reduce((acc, scene) => acc + scene.shots.length, 0);

    const handlePromptChange = (sceneName: string, shotId: number, lang: 'id' | 'en', newPrompt: string) => {
        const newScenes = scenes.map(scene => {
            if (scene.name === sceneName) {
                return {
                    ...scene,
                    shots: scene.shots.map(shot => {
                        if (shot.id === shotId) {
                             return lang === 'id' ? { ...shot, promptId: newPrompt } : { ...shot, promptEn: newPrompt };
                        }
                        return shot;
                    })
                }
            }
            return scene;
        });
        setScenes(newScenes);
    };

    const handleDownloadPrompts = () => {
        const content = scenes.map(scene => {
            const shotPrompts = scene.shots.map((shot, index) => 
                `  SHOT ${index + 1}:\n    NARRATION: ${shot.narration}\n    PROMPT (EN): ${shot.promptEn}\n    PROMPT (ID): ${shot.promptId}`
            ).join('\n\n');
            return `SCENE: ${scene.name}\n${shotPrompts}`;
        }).join('\n\n---\n\n');
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'storyboard_prompts.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    return (
        <div className="animate-fade-in w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 text-center sm:text-left">
                <div>
                    <h3 className="text-3xl font-bold font-display">Review & Kustomisasi Adegan</h3>
                    <p className="text-brand-gray-400">{totalShots} Shot dari {scenes.length} Adegan Telah Dibuat</p>
                </div>
                <button onClick={handleDownloadPrompts} className="p-2 bg-brand-gray-700 rounded-lg hover:bg-brand-gray-600 transition-colors self-center sm:self-auto" aria-label="Unduh Prompts">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
            </div>
            
            <div className="space-y-8">
                {scenes.map((scene) => (
                   <div key={scene.name} className="bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-6">
                        <h4 className="text-xl font-bold font-display text-brand-purple mb-4">{scene.name}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {scene.shots.map((shot) => (
                                <ShotCard 
                                    key={shot.id} 
                                    sceneName={scene.name}
                                    shot={shot} 
                                    onGenerateImage={onGenerateImage} 
                                    onPromptChange={handlePromptChange}
                                    onImageUpload={onImageUpload}
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
                    onClick={onProceedToAudio}
                    className="py-3 px-8 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg"
                >
                    Lanjutkan ke Audio
                </button>
            </div>
        </div>
    );
};

interface ShotCardProps {
    shot: Shot;
    sceneName: string;
    onGenerateImage: (sceneName: string, shotId: number) => void;
    onPromptChange: (sceneName: string, shotId: number, lang: 'id' | 'en', newPrompt: string) => void;
    onImageUpload: (sceneName: string, shotId: number, file: File) => void;
}

const ShotCard: React.FC<ShotCardProps> = ({ shot, sceneName, onGenerateImage, onPromptChange, onImageUpload }) => {
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);
    const [promptLang, setPromptLang] = useState<'id' | 'en'>('en');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showNotification } = useNotification();

    const handleCopyPrompt = () => {
        const promptToCopy = promptLang === 'en' ? shot.promptEn : shot.promptId;
        navigator.clipboard.writeText(promptToCopy)
            .then(() => showNotification('Prompt disalin!', 'success'))
            .catch(err => {
                console.error('Gagal menyalin prompt: ', err);
                showNotification('Gagal menyalin prompt.', 'error');
            });
    };

    const handleSavePrompt = () => {
        const promptToSave = promptLang === 'en' ? shot.promptEn : shot.promptId;
        try {
            const library = JSON.parse(localStorage.getItem('scenePromptLibrary') || '[]');
            if (!library.some((p: any) => p.prompt === promptToSave)) {
                library.push({ name: `${sceneName} - Shot ${shot.id}`, prompt: promptToSave });
                localStorage.setItem('scenePromptLibrary', JSON.stringify(library));
                showNotification('Prompt shot disimpan ke pustaka!', 'success');
            } else {
                showNotification('Prompt ini sudah ada di pustaka.', 'info');
            }
        } catch (error) {
            console.error("Could not save to scene prompt library", error);
            showNotification('Gagal menyimpan prompt ke pustaka.', 'error');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(sceneName, shot.id, file);
        }
    };

    return (
        <div className="bg-brand-gray-800 rounded-lg p-4 flex flex-col space-y-4 border border-brand-gray-700">
            <p className="text-sm text-brand-gray-400 font-medium truncate" title={shot.narration}>{`Shot ${shot.id + 1}: ${shot.narration}`}</p>
            
            <div className="aspect-video bg-brand-gray-900 rounded-md flex items-center justify-center overflow-hidden">
                {shot.isGeneratingImage ? (
                     <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                ) : shot.imageUrl ? (
                    <img src={shot.imageUrl} alt={shot.narration} className="w-full h-full object-cover"/>
                ) : (
                    <div className="text-center">
                        <p className="text-brand-gray-500 text-sm">Belum ada gambar</p>
                         <button onClick={handleUploadClick} className="mt-2 text-xs py-1 px-3 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors">
                            Unggah Gambar
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept="image/*" className="hidden" />
                    </div>
                )}
            </div>

            <div>
                <button
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    aria-expanded={isPromptExpanded}
                    className="w-full flex justify-between items-center text-left text-sm font-medium text-brand-gray-300 py-2"
                >
                    <span>{isPromptExpanded ? 'Sembunyikan Prompt Gambar' : 'Tampilkan Prompt Gambar'}</span>
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
                                    id={`prompt-en-${shot.id}`}
                                    value={shot.promptEn}
                                    onChange={(e) => onPromptChange(sceneName, shot.id, 'en', e.target.value)}
                                    rows={8}
                                    className="w-full p-2 bg-brand-gray-700 text-sm rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none resize-none"
                                />
                            ) : (
                                <textarea
                                    id={`prompt-id-${shot.id}`}
                                    value={shot.promptId}
                                    onChange={(e) => onPromptChange(sceneName, shot.id, 'id', e.target.value)}
                                    rows={8}
                                    className="w-full p-2 bg-brand-gray-700 text-sm rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none resize-none"
                                />
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button onClick={handleCopyPrompt} className="text-xs py-1 px-3 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors">Salin Prompt</button>
                            <button onClick={handleSavePrompt} className="text-xs py-1 px-3 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors">Simpan ke Pustaka</button>
                        </div>
                    </div>
                )}
            </div>
            <button
                onClick={() => onGenerateImage(sceneName, shot.id)}
                disabled={shot.isGeneratingImage}
                className="w-full py-2 px-4 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-wait"
            >
                {shot.isGeneratingImage ? 'Membuat...' : shot.imageUrl ? 'Buat Ulang Gambar' : 'Buat Gambar'}
            </button>
        </div>
    )
}

export default StoryEditor;
