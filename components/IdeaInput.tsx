
import React, { useState } from 'react';
import { StoryStyle } from '../types';

interface IdeaInputProps {
    onIdeaSubmit: (idea: string, language: 'indonesian' | 'english', storyStyle: StoryStyle, duration: number) => void;
    onScriptSubmit: (script: string, language: 'indonesian' | 'english') => void;
    onGenerateViralIdea: () => Promise<string[]>;
    onBack: () => void;
}

const storyStyles: { id: StoryStyle, name: string, description: string, enabled: boolean }[] = [
    { id: 'drama-realistis', name: 'Drama Realistis', description: 'Dialog natural dengan narasi puitis.', enabled: true },
    { id: 'thriller-psikologis', name: 'Thriller Psikologis', description: 'Dialog singkat penuh ketegangan.', enabled: false },
    { id: 'petualangan-fantasi', name: 'Petualangan Fantasi', description: 'Dialog epik & narasi magis.', enabled: false },
]

const IdeaInput: React.FC<IdeaInputProps> = ({ onIdeaSubmit, onScriptSubmit, onGenerateViralIdea, onBack }) => {
    const [idea, setIdea] = useState('');
    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    const [language, setLanguage] = useState<'indonesian' | 'english'>('indonesian');
    const [storyMethod, setStoryMethod] = useState<'idea' | 'script'>('idea');
    const [storyStyle, setStoryStyle] = useState<StoryStyle>('drama-realistis');
    const [duration, setDuration] = useState(20);
    const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (storyMethod === 'idea') {
            if (!idea.trim()) {
                setIsLoading(false);
                return;
            };
            onIdeaSubmit(idea, language, storyStyle, duration);
        } else {
            if (!script.trim()) {
                setIsLoading(false);
                return;
            };
            onScriptSubmit(script, language);
        }
    };

    const handleGenerateClick = async () => {
        setIsGeneratingIdea(true);
        setGeneratedTitles([]);
        try {
            const titles = await onGenerateViralIdea();
            setGeneratedTitles(titles);
        } catch (error) {
            console.error("Gagal mengambil ide viral dari parent:", error);
        } finally {
            setIsGeneratingIdea(false);
        }
    };

    const exampleIdea = "Seorang nenek penjual kue yang jujur menemukan dompet berisi uang banyak.";

    return (
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold font-display mb-4">Ubah Ide Anda menjadi Video</h1>
            <p className="text-lg text-brand-gray-300 mb-10">
                Mulai dengan satu kalimat atau gunakan naskah lengkap Anda. AI kami akan memprosesnya untuk Anda.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-8 shadow-2xl shadow-brand-purple/10">
                
                {storyMethod === 'idea' && (
                    <>
                        <div>
                            <p className="text-brand-gray-400 mb-2 text-left font-semibold">1. Pilih Gaya Cerita:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {storyStyles.map(style => (
                                    <button
                                        key={style.id}
                                        type="button"
                                        onClick={() => style.enabled && setStoryStyle(style.id)}
                                        disabled={!style.enabled}
                                        aria-pressed={storyStyle === style.id}
                                        className={`p-4 rounded-lg text-left transition-all duration-200 border-2 text-white ${storyStyle === style.id ? 'bg-brand-purple/20 border-brand-purple' : 'bg-brand-gray-800 border-brand-gray-700'} ${style.enabled ? 'hover:border-brand-purple/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        <p className="font-semibold">{style.name}</p>
                                        <p className="text-sm text-brand-gray-400">{style.description}</p>
                                        {!style.enabled && <span className="text-xs text-yellow-400">(Segera Hadir)</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-brand-gray-400 mb-2 text-left font-semibold">2. Pilih Durasi Target Film:</p>
                            <div className="bg-brand-gray-800 border border-brand-gray-700 rounded-lg p-4 flex items-center gap-4">
                                <input
                                    id="duration-slider"
                                    type="range"
                                    min="20"
                                    max="60"
                                    step="5"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full h-2 bg-brand-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-brand-pink"
                                />
                                <span className="font-bold text-lg w-24 text-center bg-brand-gray-900 py-1 rounded-md">{duration} menit</span>
                            </div>
                        </div>
                    </>
                )}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                     <div>
                        <p className="text-brand-gray-400 mb-2 text-left font-semibold">3. Pilih Bahasa Naskah:</p>
                        <div className="inline-flex w-full rounded-lg shadow-sm bg-brand-gray-800 border border-brand-gray-700">
                            <button
                                onClick={() => setLanguage('indonesian')}
                                type="button"
                                aria-pressed={language === 'indonesian'}
                                className={`w-1/2 px-6 py-3 rounded-l-lg font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray-900 focus:ring-brand-purple ${language === 'indonesian' ? 'bg-brand-purple text-white' : 'text-brand-gray-300 hover:bg-brand-gray-700'}`}
                            >
                                Indonesia
                            </button>
                            <button
                                onClick={() => setLanguage('english')}
                                type="button"
                                aria-pressed={language === 'english'}
                                className={`w-1/2 px-6 py-3 rounded-r-lg font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray-900 focus:ring-brand-purple ${language === 'english' ? 'bg-brand-purple text-white' : 'text-brand-gray-300 hover:bg-brand-gray-700'}`}
                            >
                                English
                            </button>
                        </div>
                    </div>
                     <div>
                        <p className="text-brand-gray-400 mb-2 text-left font-semibold">4. Metode Input:</p>
                        <div className="inline-flex w-full rounded-lg shadow-sm bg-brand-gray-800 border border-brand-gray-700">
                            <button
                                onClick={() => setStoryMethod('idea')}
                                type="button"
                                aria-pressed={storyMethod === 'idea'}
                                className={`w-1/2 px-6 py-3 rounded-l-lg font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray-900 focus:ring-brand-purple ${storyMethod === 'idea' ? 'bg-brand-purple text-white' : 'text-brand-gray-300 hover:bg-brand-gray-700'}`}
                            >
                                Tulis Ide Cerita
                            </button>
                            <button
                                onClick={() => setStoryMethod('script')}
                                type="button"
                                aria-pressed={storyMethod === 'script'}
                                className={`w-1/2 px-6 py-3 rounded-r-lg font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray-900 focus:ring-brand-purple ${storyMethod === 'script' ? 'bg-brand-purple text-white' : 'text-brand-gray-300 hover:bg-brand-gray-700'}`}
                            >
                                Gunakan Naskah Sendiri
                            </button>
                        </div>
                    </div>
                </div>

                {storyMethod === 'idea' ? (
                     <div className="relative">
                        <textarea
                            value={idea}
                            onChange={(e) => setIdea(e.target.value)}
                            className="w-full h-24 p-4 pr-32 bg-brand-gray-800 border-2 border-brand-gray-700 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all duration-300 resize-none text-lg"
                            placeholder={`Contoh: ${exampleIdea}`}
                            aria-label="Story Idea Input"
                        />
                         {language === 'indonesian' && (
                            <button
                                type="button"
                                onClick={handleGenerateClick}
                                disabled={isGeneratingIdea}
                                className="absolute top-3 right-3 py-1 px-3 bg-brand-gray-700 text-sm rounded-lg hover:bg-brand-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                title="Buatkan ide cerita viral dengan AI"
                            >
                                {isGeneratingIdea ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    '✨'
                                )}
                                <span>Buatkan Ide</span>
                            </button>
                        )}
                        {generatedTitles.length > 0 && (
                            <div className="mt-4 space-y-2 text-left">
                                <p className="font-semibold text-brand-gray-300">Pilih salah satu ide untuk memulai:</p>
                                {generatedTitles.map((title, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            setIdea(title);
                                            setGeneratedTitles([]);
                                        }}
                                        className="w-full text-left p-3 bg-brand-gray-700 rounded-lg hover:bg-brand-gray-600 transition-colors"
                                    >
                                        {title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        className="w-full h-48 p-4 bg-brand-gray-800 border-2 border-brand-gray-700 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all duration-300 resize-y text-base"
                        placeholder="Tempelkan naskah lengkap Anda di sini..."
                        aria-label="Full Script Input"
                    />
                )}
               
                <div className="mt-8 flex flex-col-reverse sm:flex-row justify-center gap-4">
                     <button
                        type="button"
                        onClick={onBack}
                        className="w-full sm:w-auto py-4 px-8 bg-brand-gray-700 text-white font-bold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300 text-xl"
                    >
                        Kembali
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || (storyMethod === 'idea' && !idea.trim()) || (storyMethod === 'script' && !script.trim())}
                        className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Memproses...
                            </>
                        ) : 'Buatkan Cerita Saya'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default IdeaInput;
