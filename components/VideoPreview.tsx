
import React, { useState, useEffect, useRef } from 'react';
import { Scene, Shot } from '../types';

interface VideoPreviewProps {
    scenes: Scene[];
    onGoToProjects: () => void;
    onBack: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ scenes, onGoToProjects, onBack }) => {
    const [currentShotIndex, setCurrentShotIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const shotsWithVideo = scenes.flatMap(s => s.shots.map(shot => ({ ...shot, sceneName: s.name }))).filter(sh => sh.videoUrl);
    const currentShot = shotsWithVideo[currentShotIndex];

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(e => console.error("Playback failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentShotIndex]);

    const handleVideoEnded = () => {
        if (currentShotIndex < shotsWithVideo.length - 1) {
            setCurrentShotIndex(prevIndex => prevIndex + 1);
        } else {
            setIsPlaying(false);
        }
    };
    
    if (shotsWithVideo.length === 0) {
        return (
            <div className="text-center">
                <p>Tidak ada video yang dibuat untuk ditampilkan.</p>
                 <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        onClick={onBack}
                        className="py-2 px-6 bg-brand-gray-700 text-white font-semibold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={onGoToProjects}
                        className="py-2 px-6 bg-brand-purple text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-300"
                    >
                        Proyek Baru
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold font-display text-center mb-6">Pratinjau Video Anda</h2>

            <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-2xl shadow-brand-purple/20">
                {currentShot && (
                    <video
                        ref={videoRef}
                        key={currentShot.id}
                        src={currentShot.videoUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted // Autoplay often requires video to be muted
                        onEnded={handleVideoEnded}
                    />
                )}
               
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4">
                    <p className="text-white text-center text-lg">{currentShot?.narration || ''}</p>
                </div>
            </div>
            
            <div className="flex justify-center items-center mt-6 space-x-4">
                <button
                    onClick={onBack}
                    className="py-2 px-6 bg-brand-gray-700 text-white font-semibold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300"
                >
                    Kembali
                </button>
                 <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full bg-brand-gray-700 hover:bg-brand-gray-600">
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                 </button>
                <button
                    onClick={onGoToProjects}
                    className="py-2 px-6 bg-brand-purple text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-300"
                >
                    Proyek Baru
                </button>
            </div>
        </div>
    );
};

export default VideoPreview;