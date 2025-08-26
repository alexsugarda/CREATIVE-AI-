
import React from 'react';
import { Character, CharacterDescription } from '../types';
import { useNotification } from '../contexts/NotificationContext';


interface ScenePromptRoomProps {
    characters: Character[];
    onConfirm: (characters: Character[]) => void;
    onBack: () => void;
    onGenerateCharacterImage: (characterId: string) => void;
}

const descriptionLabels: { [key in keyof CharacterDescription]: string } = {
    gender: 'Gender',
    age: 'Umur',
    bodyType: 'Tipe Tubuh',
    hair: 'Rambut',
    skinTone: 'Kulit',
    outfit: 'Outfit',
};

const ScenePromptRoom: React.FC<ScenePromptRoomProps> = ({ characters, onConfirm, onBack, onGenerateCharacterImage }) => {
    const { showNotification } = useNotification();

    const handleConfirm = () => {
        onConfirm(characters);
    };

    const handleCopyPrompt = (prompt: string | undefined) => {
        if (!prompt) return;
        navigator.clipboard.writeText(prompt)
            .then(() => showNotification('Prompt disalin!', 'success'))
            .catch(err => {
                console.error('Gagal menyalin prompt: ', err);
                showNotification('Gagal menyalin prompt.', 'error');
            });
    };


    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold font-display mb-2 text-center">Review Karakter & Ruang Prompt</h2>
            <p className="text-lg text-brand-gray-300 mb-8 text-center">
                AI telah menganalisis naskah Anda. Buat gambar referensi untuk setiap karakter agar visualnya konsisten.
            </p>

            <div className="space-y-8">

                 <div className="bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-bold font-display text-brand-purple mb-4 flex items-center">
                        <span className="text-2xl mr-3">👤</span> Karakter yang Ditemukan
                    </h3>
                    {characters.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {characters.map(char => (
                               <div key={char.id} className="bg-brand-gray-900 rounded-lg border border-brand-gray-700 flex flex-col md:flex-row overflow-hidden">
                                    <div className="md:w-2/5 p-4 border-b md:border-b-0 md:border-r border-brand-gray-700">
                                        <h4 className="font-bold text-white mb-2">{char.name}</h4>
                                        <ul className="text-sm text-brand-gray-400 space-y-1">
                                            {Object.entries(char.description).map(([key, value]) => (
                                                <li key={key}>
                                                    <strong className="text-brand-gray-200">{descriptionLabels[key as keyof CharacterDescription]}:</strong> {value}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="md:w-3/5 p-4 flex flex-col items-center justify-center space-y-3">
                                        <div className="w-full aspect-square bg-brand-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                                            {char.isGeneratingImage ? (
                                                <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                                            ) : char.imageUrl ? (
                                                <img src={char.imageUrl} alt={`Potret ${char.name}`} className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="text-center text-brand-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    <p className="text-xs mt-1">Buat gambar referensi</p>
                                                </div>
                                            )}
                                        </div>
                                        {char.imageUrl && !char.isGeneratingImage && (
                                            <div className="w-full space-y-2">
                                                <label htmlFor={`prompt-${char.id}`} className="text-xs font-semibold text-brand-gray-300 block">Prompt Gambar Referensi:</label>
                                                <textarea
                                                    id={`prompt-${char.id}`}
                                                    readOnly
                                                    value={char.generationPrompt || ''}
                                                    className="w-full p-2 text-xs bg-brand-gray-700 rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none resize-none"
                                                    rows={3}
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleCopyPrompt(char.generationPrompt)} className="w-full text-xs py-1 px-3 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors">Salin Prompt</button>
                                                    <a
                                                        href={char.imageUrl}
                                                        download={`${char.name}_reference.jpg`}
                                                        className="w-full text-center text-xs py-1 px-3 bg-brand-gray-700 rounded hover:bg-brand-gray-600 transition-colors"
                                                    >
                                                        Unduh Gambar
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => onGenerateCharacterImage(char.id)}
                                            disabled={char.isGeneratingImage}
                                            className="w-full py-2 px-4 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {char.isGeneratingImage ? 'Membuat...' : char.imageUrl ? 'Buat Ulang Gambar' : 'Buat Gambar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-brand-gray-400">Tidak ada karakter yang ditemukan dalam naskah.</p>
                    )}
                </div>

                <div className="bg-brand-gray-800/50 border border-brand-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-bold font-display text-brand-purple mb-4 flex items-center">
                        <span className="text-2xl mr-3">📌</span> Panduan Karakter Konsisten
                    </h3>
                    <div className="space-y-6 text-brand-gray-300 text-sm">
                        <div>
                            <h4 className="font-semibold text-white mb-2">Rumus Karakter Konsisten</h4>
                            <div className="bg-brand-gray-900 p-3 rounded-lg font-mono text-brand-pink text-xs space-y-3">
                                <div>
                                    <p className="font-sans font-bold text-white mb-1">Bahasa Indonesia:</p>
                                    <code>
                                        {'{Nama Karakter the human}, {gender}, {usia pasti atau rentang}, {bentuk tubuh}, {gaya rambut + warna rambut}, {ekspresi wajah umum}, {pakaian tetap dengan warna}, {pose tubuh khas}, {gestur atau kebiasaan kecil yang selalu muncul}.'}
                                    </code>
                                </div>
                                <div>
                                    <p className="font-sans font-bold text-white mb-1">English Version:</p>
                                    <code>
                                        {'{Name Character the human}, {gender}, {fixed age or range}, {body build}, {hairstyle + hair color}, {general facial expression}, {fixed clothing with colors}, {signature body pose}, {recurring gesture or habitual action}.'}
                                    </code>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-2">Contoh Karakter Konsisten</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="bg-brand-gray-900 p-3 rounded-lg space-y-2">
                                    <p className="font-sans font-bold text-white">Marcus the human</p>
                                    <p><strong className="text-brand-gray-400">ID:</strong> Laki-laki, usia 60 tahun, tubuh tegap sedikit bungkuk, rambut pendek abu-abu tipis, ekspresi serius dengan tatapan berat, mengenakan kemeja flanel biru tua dengan celana kerja cokelat tua, duduk tegak condong sedikit ke depan, sering memegang alat kerja logam, bergerak perlahan namun teliti.</p>
                                    <p><strong className="text-brand-gray-400">EN:</strong> Male, 60 years old, solid build slightly stooped, short thinning gray hair, serious expression with heavy gaze, wearing a dark blue flannel shirt with brown work trousers, sits leaning slightly forward, often holding a metal tool, moves slowly yet precisely.</p>
                                </div>
                                <div className="bg-brand-gray-900 p-3 rounded-lg space-y-2">
                                    <p className="font-sans font-bold text-white">Elena the human</p>
                                    <p><strong className="text-brand-gray-400">ID:</strong> Perempuan, usia 32 tahun, tubuh ramping, rambut cokelat panjang diikat sederhana, ekspresi tenang namun kaku, mengenakan blus putih longgar dengan celana abu-abu gelap dan cardigan biru pudar, sering duduk dengan tangan meraih potongan porselen, gerakan hati-hati dan pelan.</p>
                                    <p><strong className="text-brand-gray-400">EN:</strong> Female, 32 years old, slender build, long brown hair tied simply, calm but stiff expression, wearing a loose white blouse with dark gray trousers and a faded blue cardigan, often seated while holding a porcelain fragment, cautious and slow movements.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-2">Aturan Penting</h4>
                            <ul className="list-disc list-inside space-y-1 bg-brand-gray-900 p-4 rounded-lg">
                                <li>Gunakan deskripsi sama persis di semua prompt (jangan ganti-ganti kata).</li>
                                <li>Jangan tambahkan detail wajah spesifik (hidung, bibir, mata) → AI sulit konsisten.</li>
                                <li>Pakai wardrobe tetap sebagai tanda visual karakter.</li>
                                <li>Tambahkan gesture atau kebiasaan untuk pengenalan identitas.</li>
                                <li>Gunakan usia tetap kalau ingin lebih tegas → tapi harus dipakai sama di semua prompt.</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-white mb-2">Kesimpulan</h4>
                            <div className="bg-brand-gray-900 p-4 rounded-lg">
                                <p>👉 Untuk menjaga karakter konsisten dalam AI Text-to-Video:</p>
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    <li>Kunci usia, tubuh, rambut, pakaian.</li>
                                    <li>Gunakan ekspresi umum bukan anatomi wajah detail.</li>
                                    <li>Tambahkan gesture khas untuk memperkuat identitas.</li>
                                    <li>Pakai rumus karakter konsisten di setiap prompt.</li>
                                    <li>Jangan pernah ubah deskripsi antar adegan — yang boleh berubah hanya shot type, aksi, kamera, dan properti sekitar.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="mt-8 flex justify-center space-x-4">
                <button
                    onClick={onBack}
                    className="py-3 px-8 bg-brand-gray-700 text-white font-bold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300 text-lg"
                >
                    Kembali
                </button>
                 <button
                    onClick={handleConfirm}
                    className="py-3 px-8 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg"
                >
                    Karakter Sesuai & Lanjutkan
                </button>
            </div>
        </div>
    );
};

export default ScenePromptRoom;
