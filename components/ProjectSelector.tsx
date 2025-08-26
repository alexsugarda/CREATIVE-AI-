
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import * as projectService from '../services/projectService';

interface ProjectSelectorProps {
    onNewProject: () => void;
    onLoadProject: (projectId: string) => void;
    onOpenApiSettings: () => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onNewProject, onLoadProject, onOpenApiSettings }) => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        setProjects(projectService.getProjects());
    }, []);
    
    const handleDelete = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (window.confirm('Apakah Anda yakin ingin menghapus proyek ini?')) {
            projectService.deleteProject(projectId);
            setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold font-display mb-4">Pustaka Proyek Anda</h1>
            <p className="text-lg text-brand-gray-300 mb-10">
                Lanjutkan proyek terakhir Anda atau mulai petualangan naratif yang baru.
            </p>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onNewProject}
                        className="flex-grow w-full py-4 px-6 bg-gradient-to-r from-brand-pink to-brand-purple text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 text-xl"
                    >
                        Mulai Proyek Baru
                    </button>
                    <button
                        onClick={onOpenApiSettings}
                        className="flex-shrink-0 py-4 px-6 bg-brand-gray-700 text-white font-bold rounded-lg hover:bg-brand-gray-600 transition-colors duration-300 text-lg flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Pengaturan API
                    </button>
                </div>

                {projects.length > 0 ? (
                    <div className="space-y-4 text-left">
                        {projects.map(project => (
                            <div key={project.id} onClick={() => onLoadProject(project.id)} className="bg-brand-gray-800 border border-brand-gray-700 rounded-lg p-4 flex justify-between items-center hover:bg-brand-gray-700/50 cursor-pointer transition-colors">
                                <div>
                                    <h3 className="font-bold text-lg">{project.name}</h3>
                                    <p className="text-sm text-brand-gray-400">
                                        Terakhir diubah: {new Date(project.lastModified).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={(e) => handleDelete(project.id, e)} className="p-2 text-brand-gray-400 hover:text-red-500 transition-colors" aria-label="Hapus Proyek">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-brand-gray-400 pt-4">Anda belum memiliki proyek tersimpan.</p>
                )}
                
                <div className="pt-4 border-t border-brand-gray-700">
                     <button
                        disabled
                        title="Segera Hadir"
                        className="w-full py-3 px-6 bg-brand-gray-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                    >
                         <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="currentColor" d="M21.1 19.3l-2.4 4.1L12.9 14 10.5 18l-4.7-8 7.1.2 2.4-4.2 6.1 10.6 2.4-4.2zM27.2 12L20 0H12L4.8 12H0l16 20 16-20z"/></svg>
                        Hubungkan ke Google Drive (Segera Hadir)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSelector;
