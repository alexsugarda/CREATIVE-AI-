
import React, { useState } from 'react';
import { YoutubeMetadata, ThumbnailOption } from '../types';

interface MetadataGeneratorProps {
    metadata: YoutubeMetadata;
    setMetadata: (metadata: YoutubeMetadata) => void;
    thumbnailOptions: ThumbnailOption[];
    onGenerateThumbnail: (optionId: number, prompt: string) => void;
    onBack: () => void;
    onFinalize: () => void;
}

const panels = [
    { key: 'metadata', title: 'Metadata YouTube' },
    { key: 'thumbnail', title: 'Thumbnail Video' },
    { key: 'tips', title: 'Panduan Editing CapCut' },
];

const MetadataGenerator: React.FC<MetadataGeneratorProps> = ({
    metadata,
    setMetadata,
    thumbnailOptions,
    onGenerateThumbnail,
    onBack,
    onFinalize
}) => {
    const [currentPanel, setCurrentPanel] = useState<'metadata' | 'thumbnail' | 'tips'>('thumbnail');
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    
    const handleMetadataChange = (field: keyof YoutubeMetadata, value: string | string[]) => {
        setMetadata({ ...metadata, [field]: value });
    };

    const handleUseAlternativeTitle = (title: string) => {
        setMetadata({ ...metadata, title });
    };

    const currentIndex = panels.findIndex(p => p.key === currentPanel);

    const renderContent = () => {
        switch (currentPanel) {
            case 'metadata':
                return (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold font-display text-brand-purple mb-4">Metadata YouTube</h3>
                        <div>
                            <label htmlFor="title" className="text-sm font-semibold text-brand-gray-300 block mb-2">Judul Video</label>
                            <input
                                type="text"
                                id="title"
                                value={metadata.title}
                                onChange={(e) => handleMetadataChange('title', e.target.value)}
                                className="w-full p-2 bg-brand-gray-800 border border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none"
                            />
                        </div>
                         <div>
                            <h4 className="text-sm font-semibold text-brand-gray-300 block mb-2">Saran Judul Alternatif (dari AI)</h4>
                            <div className="space-y-2">
                                {metadata.alternativeTitles.map((altTitle, index) => (
                                    <div key={index} className="flex items-center justify-between bg-brand-gray-900 p-2 rounded-lg">
                                        <p className="text-sm text-brand-gray-300">{altTitle}</p>
                                        <button onClick={() => handleUseAlternativeTitle(altTitle)} className="text-xs py-1 px-3 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors flex-shrink-0">
                                            Gunakan
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="text-sm font-semibold text-brand-gray-300 block mb-2">Deskripsi</label>
                            <textarea
                                id="description"
                                value={metadata.description}
                                onChange={(e) => handleMetadataChange('description', e.target.value)}
                                rows={8}
                                className="w-full p-2 bg-brand-gray-800 border border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none resize-y"
                            />
                        </div>
                        <div>
                            <label htmlFor="hashtags" className="text-sm font-semibold text-brand-gray-300 block mb-2">Hashtags (pisahkan dengan koma)</label>
                            <input
                                type="text"
                                id="hashtags"
                                value={metadata.hashtags.join(', ')}
                                onChange={(e) => handleMetadataChange('hashtags', e.target.value.split(',').map(h => h.trim()))}
                                className="w-full p-2 bg-brand-gray-800 border border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none"
                            />
                        </div>
                    </div>
                );
            case 'thumbnail':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold font-display text-brand-purple">Thumbnail Video</h3>
                            <button onClick={() => setIsGuideOpen(!isGuideOpen)} className="flex items-center gap-2 text-sm text-brand-gray-300 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>{isGuideOpen ? 'Sembunyikan Panduan' : 'Tampilkan Panduan Prompt'}</span>
                            </button>
                        </div>

                        {isGuideOpen && (
                             <div className="bg-brand-gray-900/50 p-6 rounded-lg border border-brand-gray-700 space-y-4 prose prose-invert max-w-none text-brand-gray-300 text-sm">
                                <h4 className="text-lg font-bold text-brand-purple !text-brand-purple">🎯 Formula Emas Thumbnail Konsisten</h4>
                                <p>Untuk menjaga konsistensi visual karakter di setiap thumbnail, AI kami menggunakan formula prompt 5-lapis. Anda dapat menggunakan panduan ini saat mengedit prompt yang ada atau membuat prompt kustom Anda sendiri.</p>
                                
                                <strong className="text-white">Struktur Prompt (Urutan Prioritas):</strong>
                                <ol className="!my-2 space-y-2">
                                    <li><strong>Gaya & Kualitas Visual:</strong> Tentukan kualitas dan tone. <br/> <code className="text-xs bg-brand-gray-800 px-1 py-0.5 rounded">"Cinematic movie poster, inspired by Korean drama aesthetics, ultra-detailed 4K, sharp focus"</code></li>
                                    <li><strong>Deskripsi Karakter KONSISTEN:</strong> Salin-tempel 'consistency string' dari tahap karakter. <br/> <strong className="text-red-400 text-xs">Ini adalah kunci agar karakter tidak berubah-ubah!</strong></li>
                                    <li><strong>Aksi & Emosi Karakter:</strong> Deskripsikan pose, ekspresi, dan interaksi. <br/> <code className="text-xs bg-brand-gray-800 px-1 py-0.5 rounded">"Fatimah menatap keluar jendela, air mata mengalir..."</code></li>
                                    <li><strong>Latar & Komposisi Visual:</strong> Atur suasana, pencahayaan, dan posisi. <br/> <code className="text-xs bg-brand-gray-800 px-1 py-0.5 rounded">"Latar ruang keluarga mewah namun suram, cahaya dramatis dari jendela."</code></li>
                                    <li><strong>Teks & Detail Teknis:</strong> Tambahkan judul dan detail teknis. <br/> <code className="text-xs bg-brand-gray-800 px-1 py-0.5 rounded">"Judul ‘Penjara Emas’ dengan font serif minimalis. Widescreen 1792x1024."</code></li>
                                </ol>

                                <strong className="text-white">🧩 Rumus Prompt Final:</strong>
                                <p className="bg-brand-gray-800 p-2 rounded font-mono text-xs not-prose">
                                    [Gaya & Kualitas] + [Deskripsi Karakter] + [Aksi & Emosi] + [Latar & Komposisi] + [Teks & Detail Teknis]
                                </p>

                                <p>Dengan mengikuti formula ini, AI tidak hanya membuat thumbnail yang menarik, tapi juga akurat dan konsisten dengan cerita Anda.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {thumbnailOptions.map(option => (
                                <div key={option.id} className="space-y-2 p-2 bg-brand-gray-900/50 rounded-lg border border-brand-gray-700/50">
                                    <div className="aspect-video bg-brand-gray-900 rounded-md flex items-center justify-center overflow-hidden">
                                        {option.isGenerating ? (
                                            <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                        ) : option.imageUrl ? (
                                            <img src={option.imageUrl} alt={`Thumbnail option ${option.id + 1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <p className="text-brand-gray-500 text-xs text-center p-2">Klik "Buat" untuk melihat hasil</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-brand-gray-400 h-20 overflow-y-auto p-1 bg-brand-gray-800/50 rounded">
                                        <strong className="text-brand-gray-300">Prompt:</strong> {option.prompt}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onGenerateThumbnail(option.id, option.prompt)}
                                            disabled={option.isGenerating}
                                            className="w-full py-2 px-4 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {option.isGenerating ? 'Membuat...' : 'Buat Ulang'}
                                        </button>
                                        {option.imageUrl && !option.isGenerating && (
                                            <a
                                                href={option.imageUrl}
                                                download={`thumbnail_${option.id + 1}.jpg`}
                                                className="flex-shrink-0 p-2 bg-brand-gray-700 rounded-lg hover:bg-brand-gray-600 transition-colors flex items-center justify-center"
                                                aria-label="Unduh Thumbnail"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div>
                            <label htmlFor="thumbnail-upload" className="text-sm font-semibold text-brand-gray-300">Atau unggah thumbnail kustom Anda</label>
                             <input type="file" id="thumbnail-upload" accept="image/*" className="mt-2 w-full text-sm text-brand-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gray-700 file:text-white hover:file:bg-brand-gray-600"/>
                        </div>
                    </div>
                );
            case 'tips':
                 return (
                    <div className="space-y-8 prose prose-invert prose-lg max-w-none text-brand-gray-300">
                        <h3 className="text-3xl font-bold font-display text-brand-purple mb-4 !text-brand-purple">Masterclass Editing: Dari Aset ke Karya Sinematik</h3>
                        
                        <p className="text-lg">
                            Anda telah sampai di tahap akhir yang paling seru: <strong>pasca-produksi</strong>. Di sinilah semua aset yang Anda buat—klip video, narasi, musik—dirangkai menjadi sebuah cerita utuh yang emosional. Ikuti panduan ini untuk mengubah bahan mentah Anda menjadi sebuah mahakarya.
                        </p>
                        
                        <div className="border-t border-brand-gray-700 my-6"></div>

                        <h4 className="text-2xl font-bold font-display text-white !text-white flex items-center"><span className="text-3xl mr-3">✅</span>Fase 1: Persiapan Aset Anda</h4>
                        <p>Pastikan Anda telah mengunduh dan menyiapkan semua file yang dibutuhkan di satu folder agar mudah diakses:</p>
                        <ul className="!my-4">
                            <li><strong>Semua Klip Video:</strong> Setiap shot video yang telah Anda buat dari storyboard.</li>
                            <li><strong>File Narasi Audio:</strong> <code>narration.mp3</code> yang berisi seluruh sulih suara cerita Anda.</li>
                            <li><strong>File Subtitle:</strong> <code>subtitles.srt</code> sebagai panduan sinkronisasi dan untuk diunggah ke YouTube.</li>
                            <li><strong>Musik Latar (BGM):</strong> File musik yang telah Anda pilih dari sumber eksternal (misal: Pixabay, Artlist).</li>
                            <li><strong>Efek Suara (SFX):</strong> File efek suara yang relevan (jika ada).</li>
                        </ul>

                        <div className="border-t border-brand-gray-700 my-6"></div>

                        <h4 className="text-2xl font-bold font-display text-white !text-white flex items-center"><span className="text-3xl mr-3">🎧</span>Fase 2: Voice Over Profesional dengan ElevenLabs (Saran)</h4>
                        <p>Kualitas audio narasi adalah kunci emosi. Jika Anda ingin suara yang lebih profesional, kami merekomendasikan menggunakan naskah Text-to-Speech Anda di <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="text-brand-pink hover:underline">ElevenLabs</a>.</p>
                        <div className="grid md:grid-cols-2 gap-6 !my-4">
                            <div className="bg-brand-gray-900/50 p-4 rounded-lg border border-brand-gray-700">
                                <strong className="text-white">Saran Karakter Suara:</strong>
                                <ul className="!mt-2 !mb-0 text-sm">
                                    <li><strong>Adam:</strong> Suara pria yang dalam, jernih, dan berwibawa. Sangat cocok untuk cerita drama yang serius dan inspiratif.</li>
                                    <li><strong>Rachel:</strong> Suara wanita yang hangat, ekspressif, dan serbaguna. Cocok untuk berbagai genre cerita.</li>
                                </ul>
                            </div>
                            <div className="bg-brand-gray-900/50 p-4 rounded-lg border border-brand-gray-700">
                                <strong className="text-white">Pengaturan Suara (Voice Settings):</strong>
                                 <ul className="!mt-2 !mb-0 text-sm">
                                    <li><strong>Stability:</strong> Setel antara <code>30%</code> - <code>40%</code>. Ini memberikan suara yang stabil namun tetap memiliki intonasi emosional yang natural.</li>
                                    <li><strong>Clarity + Similarity Boost:</strong> Setel sekitar <code>75%</code>. Ini memastikan setiap kata diucapkan dengan jelas.</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="border-t border-brand-gray-700 my-6"></div>

                        <h4 className="text-2xl font-bold font-display text-white !text-white flex items-center"><span className="text-3xl mr-3">🎬</span>Fase 3: Merakit Cerita di CapCut (Desktop)</h4>
                        <p>Buka CapCut dan mari kita mulai menyusun puzzle cerita Anda.</p>
                        <ol className="!my-4">
                            <li><strong>Setup Proyek & Impor Aset:</strong> Buat proyek baru. Klik <strong>'Import'</strong> dan pilih semua file aset yang telah Anda siapkan.</li>
                            <li><strong>Menyusun Timeline Visual Utama:</strong> Seret (drag and drop) semua klip video Anda satu per satu ke timeline utama di bagian bawah. Pastikan urutannya sesuai dengan alur cerita (Shot 1, Shot 2, Shot 3, dst).</li>
                            <li><strong>Menambahkan Narasi & Sinkronisasi:</strong> Seret file audio narasi (<code>narration.mp3</code>) ke timeline, letakkan di bawah lapisan video. Sekarang, putar video dan dengarkan narasinya. Geser klip-klip video Anda agar setiap adegan visual cocok dengan bagian narasi yang sedang dibacakan. <strong>Gunakan file <code>subtitles.srt</code> sebagai panduan waktu Anda!</strong></li>
                            <li><strong>Menghidupkan Suasana dengan BGM & SFX:</strong> Seret file BGM ke lapisan audio di bawah narasi. <strong>Tips Kunci:</strong> Klik kanan pada klip BGM, pilih 'Audio', lalu turunkan volumenya menjadi sekitar <strong>-15dB hingga -20dB</strong>. Musik harus mendukung, bukan menenggelamkan narasi. Letakkan SFX di titik-titik yang sesuai (misal: suara pintu, deru mobil).</li>
                            <li><strong>Sentuhan Akhir Sinematik:</strong>
                                <ul className="!my-2">
                                    <li><strong>Transisi Halus:</strong> Di antara setiap klip video, tambahkan transisi <strong>'Dissolve'</strong> atau <strong>'Fade to Black'</strong> dengan durasi singkat (sekitar 0.3 detik) untuk perpindahan yang mulus.</li>
                                    <li><strong>Color Grading:</strong> Buka tab <strong>'Adjustment'</strong> atau <strong>'Filters'</strong>. Pilih filter sinematik seperti <strong>'Oppenheimer'</strong>, <strong>'Dune'</strong>, atau <strong>'Faded'</strong> untuk memberikan mood warna yang konsisten pada seluruh video.</li>
                                </ul>
                            </li>
                        </ol>

                        <div className="border-t border-brand-gray-700 my-6"></div>

                        <h4 className="text-2xl font-bold font-display text-white !text-white flex items-center"><span className="text-3xl mr-3">📊</span>Contoh Struktur Timeline Profesional</h4>
                        <p>Bayangkan timeline editor video Anda seperti tabel ini. Ini adalah kunci untuk memahami alur kerja profesional.</p>
                        <div className="bg-brand-gray-900/50 p-4 rounded-lg border border-brand-gray-700 not-prose my-4">
                            <div className="grid grid-cols-4 gap-2 text-center font-bold border-b border-brand-gray-600 pb-2 mb-2 text-sm text-white">
                                <div>Waktu</div>
                                <div>Track Video</div>
                                <div>Track Audio 1 (Narasi)</div>
                                <div>Track Audio 2 (Musik/SFX)</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-left text-xs text-brand-gray-300">
                                <div className="p-2 font-mono">00:00 - 00:08</div>
                                <div className="p-2 bg-brand-gray-800 rounded">Klip Video Shot 1</div>
                                <div className="p-2 bg-brand-gray-800 rounded">"Suara kokok ayam bersahutan..."</div>
                                <div className="p-2 bg-brand-gray-800 rounded row-span-3 flex items-center justify-center">BGM: Piano Melankolis (-18dB)</div>
                                
                                <div className="p-2 font-mono">00:08 - 00:15</div>
                                <div className="p-2 bg-brand-gray-800 rounded">Klip Video Shot 2</div>
                                <div className="p-2 bg-brand-gray-800 rounded">"Di sisi lain, Ibu Fatma..."</div>

                                <div className="p-2 font-mono">00:15 - 00:23</div>
                                <div className="p-2 bg-brand-gray-800 rounded">Klip Video Shot 3</div>
                                <div className="p-2 bg-brand-gray-800 rounded">"Sambil menata mangkuk..."</div>
                            </div>
                        </div>

                         <div className="border-t border-brand-gray-700 my-6"></div>

                        <h4 className="text-2xl font-bold font-display text-white !text-white flex items-center"><span className="text-3xl mr-3">🚀</span>Fase 4: Ekspor & Unggah ke YouTube</h4>
                        <p>Setelah semuanya sempurna, saatnya mengekspor dan membagikan karya Anda.</p>
                         <ul className="!my-4">
                            <li><strong>Pengaturan Ekspor:</strong> Gunakan resolusi <strong>1080p</strong>, frame rate <strong>30fps</strong>, dan format <strong>MP4</strong>. Ini adalah standar emas untuk YouTube.</li>
                            <li><strong>Unggah Metadata:</strong> Gunakan judul, deskripsi, dan tag yang sudah Anda siapkan di langkah sebelumnya.</li>
                            <li><strong>Unggah Subtitle:</strong> Saat mengunggah video Anda, jangan lupa untuk mengunggah file <strong><code>subtitles.srt</code></strong> di bagian 'Subtitles'. Ini adalah senjata rahasia SEO Anda!</li>
                        </ul>
                    </div>
                );
        }
    }


    return (
        <div className="animate-fade-in w-full max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-display mb-2 text-center">Finalisasi Proyek Anda</h2>
            <p className="text-lg text-brand-gray-300 mb-8 text-center">
                Ikuti tiga langkah ini untuk mengoptimalkan video Anda sebelum pratinjau.
            </p>

            <div className="flex items-center w-full mb-8">
                {panels.map((panel, index) => (
                    <React.Fragment key={panel.key}>
                        <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300 ${currentIndex >= index ? 'bg-brand-purple text-white' : 'bg-brand-gray-700 text-brand-gray-400'}`}>
                                {index + 1}
                            </div>
                            <p className={`ml-3 font-semibold transition-colors duration-300 hidden sm:block ${currentIndex >= index ? 'text-white' : 'text-brand-gray-400'}`}>{panel.title}</p>
                        </div>
                        {index < panels.length - 1 && (
                            <div className={`flex-grow h-1 mx-4 transition-colors duration-300 ${currentIndex > index ? 'bg-brand-purple' : 'bg-brand-gray-700'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-8 min-h-[500px]">
                {renderContent()}
            </div>

            <div className="mt-8 flex justify-center space-x-4">
                <button
                    onClick={() => {
                        if (currentIndex === 0) {
                            onBack();
                        } else {
                            setCurrentPanel(panels[currentIndex - 1].key as 'metadata' | 'thumbnail' | 'tips');
                        }
                    }}
                    className="py-3 px-8 bg-brand-gray-700 text-white font-bold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300 text-lg"
                >
                    {currentIndex === 0 ? 'Kembali ke Video' : 'Kembali'}
                </button>
                <button
                    onClick={() => {
                        if (currentIndex === panels.length - 1) {
                            onFinalize();
                        } else {
                            setCurrentPanel(panels[currentIndex + 1].key as 'metadata' | 'thumbnail' | 'tips');
                        }
                    }}
                    className="py-3 px-8 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg"
                >
                    {currentIndex === panels.length - 1 ? 'Lanjutkan ke Pratinjau' : 'Lanjutkan'}
                </button>
            </div>
        </div>
    );
};

export default MetadataGenerator;
