import React from 'react';

interface HeaderProps {
    isProjectActive: boolean;
    onGoToProjects: () => void;
    onSaveProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ isProjectActive, onGoToProjects, onSaveProject }) => {
    return (
        <header className="py-4 bg-brand-gray-800/50 backdrop-blur-sm border-b border-brand-gray-700 sticky top-0 z-10">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-purple">
                        Naratif AI
                    </h1>
                    <p className="text-sm text-brand-gray-400">Your AI-powered story factory</p>
                </div>
                {isProjectActive && (
                    <div className="flex items-center space-x-4">
                        <button onClick={onGoToProjects} className="text-sm py-2 px-4 bg-brand-gray-700 rounded-lg hover:bg-brand-gray-600 transition-colors">
                           Proyek Saya
                        </button>
                         <button onClick={onSaveProject} className="text-sm py-2 px-4 bg-brand-purple text-white font-semibold rounded-lg hover:bg-opacity-90 transition-opacity">
                            Simpan Proyek
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
