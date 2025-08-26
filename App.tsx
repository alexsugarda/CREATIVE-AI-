
import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { AppState, Scene, Character, AudioRecommendations, Project, YoutubeMetadata, ThumbnailOption, StoryStyle, Shot, ApiSettings, CharacterDescription } from './types';
import * as projectService from './services/projectService';
import * as aiService from './services/geminiService';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import Notification from './components/Notification';

import Header from './components/Header';
import IdeaInput from './components/IdeaInput';
import GeneratingProgress from './components/GeneratingProgress';
import ScenePromptRoom from './components/ScenePromptRoom';
import StoryEditor from './components/StoryEditor';
import AudioVideoGenerator from './components/AudioVideoGenerator';
import VideoGenerator from './components/VideoGenerator';
import VideoPreview from './components/VideoPreview';
import ProjectSelector from './components/ProjectSelector';
import MetadataGenerator from './components/MetadataGenerator';
import StrategyReview from './components/StrategyReview';
import ScriptWritingRoom from './components/ScriptWritingRoom';
import ApiSettingsModal from './components/ApiSettingsModal';

const API_SETTINGS_KEY = 'narratifAiApiSettings';

const AppContent: React.FC = () => {
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [appState, setAppState] = useState<AppState>(AppState.PROJECT_SELECTOR);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
    const [isGeneratingMoreScript, setIsGeneratingMoreScript] = useState(false);
    const [isGeneratingTts, setIsGeneratingTts] = useState(false);
    const { showNotification } = useNotification();
    const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
    const [apiSettings, setApiSettings] = useState<ApiSettings>({
        provider: 'gemini',
        keys: { gemini: '', groq: '', openai: '' }
    });

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(API_SETTINGS_KEY);
            if (savedSettings) {
                setApiSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error("Failed to load API settings from localStorage", error);
        }
    }, []);

    const handleSaveApiSettings = (settings: ApiSettings) => {
        try {
            localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
            setApiSettings(settings);
            showNotification('Pengaturan API berhasil disimpan!', 'success');
            setIsApiSettingsOpen(false);
        } catch (error) {
            console.error("Failed to save API settings to localStorage", error);
            showNotification('Gagal menyimpan pengaturan API.', 'error');
        }
    };
    
    const checkApiKey = useCallback(() => {
        const activeProvider = apiSettings.provider;
        const keyForProvider = apiSettings.keys[activeProvider];

        // The process.env.API_KEY is a fallback specifically for Gemini.
        const isGeminiFallbackAvailable = activeProvider === 'gemini' && process.env.API_KEY;

        if (!keyForProvider && !isGeminiFallbackAvailable) {
            showNotification(`Silakan masukkan API Key ${activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)} Anda di Pengaturan API.`, 'error');
            setIsApiSettingsOpen(true);
            return false;
        }
        return true;
    }, [apiSettings, showNotification]);

    const handleApiError = useCallback((error: unknown, contextMessage: string) => {
        console.error(`Error during ${contextMessage}:`, error);
        let userMessage = `Gagal ${contextMessage}. Cek API Key atau coba lagi.`;
        
        if (error instanceof Error && (error.message.includes('429') || error.message.toUpperCase().includes('RESOURCE_EXHAUSTED') || error.message.toUpperCase().includes('QUOTA'))) {
            userMessage = 'Batas penggunaan API tercapai. Silakan coba lagi nanti atau periksa kuota Anda.';
        }
        
        showNotification(userMessage, 'error');
    }, [showNotification]);


    const updateProjectState = useCallback((updates: Partial<Project>) => {
        setCurrentProject(prev => {
            if (!prev) return null;
            const updatedProject = { ...prev, ...updates, lastModified: Date.now() };
            return updatedProject;
        });
    }, []);

    const setAndSaveAppState = useCallback((newState: AppState) => {
        setAppState(newState);
        setCurrentProject(prev => {
            if (prev) {
                const updatedProject = { ...prev, appState: newState, lastModified: Date.now() };
                projectService.saveProject(updatedProject);
                return updatedProject;
            }
            return null;
        });
    }, []);

    const handleNewProject = () => {
        const newProject: Project = {
            id: `proj_${Date.now()}`,
            name: 'Proyek Baru Tanpa Judul',
            lastModified: Date.now(),
            appState: AppState.IDEA_INPUT,
            storyIdea: '',
            language: 'indonesian',
            storyStyle: 'drama-realistis',
            duration: 20,
            submissionType: 'idea',
            synopsis: '',
            genre: '',
            targetAudience: '',
            titleOptions: [],
            selectedTitle: '',
            script: [],
            ttsScript: '',
            generatedEpisodes: 0,
            characters: [],
            scenes: [],
            audioRecommendations: null,
            youtubeMetadata: null,
            thumbnailOptions: [],
        };
        setCurrentProject(newProject);
        setAppState(AppState.IDEA_INPUT);
    };

    const handleLoadProject = (projectId: string) => {
        const projects = projectService.getProjects();
        const projectToLoad = projects.find(p => p.id === projectId);
        if (projectToLoad) {
            // Ensure script is an array for backward compatibility
            if (typeof projectToLoad.script === 'string') {
                projectToLoad.script = [projectToLoad.script];
            }
            setCurrentProject(projectToLoad);
            setAppState(projectToLoad.appState);
        } else {
            showNotification('Gagal memuat proyek.', 'error');
        }
    };

    const handleSaveProject = useCallback(() => {
        if (!currentProject) return;

        let projectToSave = { ...currentProject, appState, lastModified: Date.now() };

        if (projectToSave.name === 'Proyek Baru Tanpa Judul' || projectToSave.name === 'Proyek dari Naskah') {
             if (projectToSave.selectedTitle) {
                projectToSave.name = projectToSave.selectedTitle;
            } else if (projectToSave.storyIdea) {
                const autoName = projectToSave.storyIdea.split(' ').slice(0, 5).join(' ');
                projectToSave.name = `${autoName}...`;
            } else {
                showNotification('Silakan masukkan ide cerita atau naskah terlebih dahulu untuk menyimpan proyek.', 'info');
                return;
            }
        }
        
        projectService.saveProject(projectToSave);
        setCurrentProject(projectToSave);
        showNotification(`Proyek "${projectToSave.name}" berhasil disimpan!`, 'success');
    }, [currentProject, appState, showNotification]);

    const goToProjectSelector = () => {
        setCurrentProject(null);
        setAppState(AppState.PROJECT_SELECTOR);
    };

    const handleIdeaSubmit = useCallback(async (idea: string, language: 'indonesian' | 'english', storyStyle: StoryStyle, duration: number) => {
        if (!checkApiKey()) return;
        updateProjectState({ storyIdea: idea, language, storyStyle, duration, submissionType: 'idea' });
        try {
            setAndSaveAppState(AppState.GENERATING_STRATEGY);
            setProgressMessage('Menganalisis ide & menyusun strategi...');
            const strategy = await aiService.generateStoryStrategy(idea, apiSettings);
            updateProjectState({
                synopsis: strategy.synopsis,
                genre: strategy.genre,
                targetAudience: strategy.targetAudience,
                titleOptions: strategy.titleOptions,
            });
            setAndSaveAppState(AppState.STRATEGY_REVIEW);
        } catch (err) {
            handleApiError(err, 'membuat strategi cerita');
            setAndSaveAppState(AppState.IDEA_INPUT);
        }
    }, [setAndSaveAppState, updateProjectState, checkApiKey, apiSettings, handleApiError]);
    
    const handleGenerateViralIdea = useCallback(async (): Promise<string[]> => {
        if (!checkApiKey()) {
            throw new Error("API Key tidak diatur.");
        }
        try {
            const titles = await aiService.generateViralIdea(apiSettings);
            return titles;
        } catch (err) {
            handleApiError(err, 'membuat ide cerita');
            throw err;
        }
    }, [checkApiKey, apiSettings, handleApiError]);

    const handleScriptSubmit = useCallback(async (script: string, language: 'indonesian' | 'english') => {
        if (!checkApiKey()) return;
        
        updateProjectState({ 
            script: [script], // Store as the first element in the array
            language, 
            submissionType: 'script', 
            name: "Proyek dari Naskah", 
            storyIdea: script.substring(0, 100) + '...',
            duration: Math.round(script.split(/\s+/).filter(Boolean).length / 140) // Estimate duration
        });
        
        try {
            setAndSaveAppState(AppState.GENERATING_SCENES); 
            setProgressMessage('Menganalisis karakter dari naskah Anda...');
            const generatedCharacters = await aiService.generateCharacterSheets(script, apiSettings);
            
            if (!generatedCharacters || generatedCharacters.length === 0) {
                showNotification('Tidak ada karakter yang dapat diidentifikasi dari naskah. Mohon revisi naskah Anda atau coba lagi.', 'error');
                setAndSaveAppState(AppState.IDEA_INPUT);
                return;
            }

            updateProjectState({ characters: generatedCharacters, scenes: [] });
            setAndSaveAppState(AppState.CHARACTER_REVIEW);
        } catch (err) {
            handleApiError(err, 'menganalisis karakter');
            setAndSaveAppState(AppState.IDEA_INPUT);
        }
    }, [showNotification, setAndSaveAppState, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleStrategyConfirm = useCallback(async (selectedTitle: string) => {
        if (!currentProject?.synopsis || !checkApiKey()) return;
        updateProjectState({ selectedTitle: selectedTitle, script: [], ttsScript: '', generatedEpisodes: 0 });
        try {
            setAndSaveAppState(AppState.GENERATING_SCRIPT);
            setProgressMessage('Membuat naskah awal...');
            const { synopsis, language, storyStyle, duration } = currentProject;
            const initialScript = await aiService.generateInitialScript(synopsis, language, selectedTitle, storyStyle, duration, apiSettings);
            updateProjectState({ script: [initialScript], generatedEpisodes: 3 });
            setAndSaveAppState(AppState.SCRIPT_WRITING_ROOM);
        } catch (err) {
            handleApiError(err, 'membuat naskah awal');
            setAndSaveAppState(AppState.STRATEGY_REVIEW);
        }
    }, [currentProject, setAndSaveAppState, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleContinueScript = useCallback(async () => {
        if (!currentProject?.script || !currentProject.selectedTitle || !checkApiKey()) return;
        setIsGeneratingMoreScript(true);
        try {
            const { script, language, selectedTitle, storyStyle, generatedEpisodes } = currentProject;
            const currentEpisodeCount = generatedEpisodes || 0;
            const fullScript = script.join('\n\n');
            
            const newScriptPart = await aiService.continueScript(fullScript, language, selectedTitle, storyStyle, currentEpisodeCount, apiSettings);
            
            updateProjectState({
                script: [...script, newScriptPart],
                generatedEpisodes: currentEpisodeCount + 3,
                ttsScript: '', // Invalidate to regenerate
            });

        } catch(err) {
            handleApiError(err, 'melanjutkan naskah');
        } finally {
            setIsGeneratingMoreScript(false);
        }
    }, [currentProject, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleGenerateTtsScript = useCallback(async () => {
        if (!currentProject?.script || currentProject.script.length === 0 || currentProject.ttsScript || !checkApiKey()) return; 
        setIsGeneratingTts(true);
        try {
            const fullScript = currentProject.script.join('\n\n');
            const ttsScript = await aiService.generateTtsScript(fullScript, apiSettings);
            updateProjectState({ ttsScript });
        } catch(err) {
            handleApiError(err, 'membuat naskah TTS');
        } finally {
            setIsGeneratingTts(false);
        }
    }, [currentProject, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleScriptFinalized = useCallback(async () => {
        if (!currentProject?.script || currentProject.script.length === 0 || !checkApiKey()) return;
        try {
            const fullScript = currentProject.script.join('\n\n');
            setAndSaveAppState(AppState.GENERATING_SCENES); 
            setProgressMessage('Menganalisis karakter dari naskah final...');
            const generatedCharacters = await aiService.generateCharacterSheets(fullScript, apiSettings);
            
            if (!generatedCharacters || generatedCharacters.length === 0) {
                showNotification('Tidak ada karakter yang dapat diidentifikasi dari naskah. Mohon revisi naskah Anda atau coba lagi.', 'error');
                setAndSaveAppState(AppState.SCRIPT_WRITING_ROOM);
                return;
            }

            updateProjectState({ characters: generatedCharacters, scenes: [] }); // Reset scenes
            setAndSaveAppState(AppState.CHARACTER_REVIEW);
        } catch (err) {
            handleApiError(err, 'menganalisis karakter');
            setAndSaveAppState(AppState.SCRIPT_WRITING_ROOM);
        }
    }, [currentProject?.script, showNotification, setAndSaveAppState, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleBackToStrategy = () => {
        if (currentProject) {
            updateProjectState({ script: [], generatedEpisodes: 0, ttsScript: '' });
        }
        setAndSaveAppState(AppState.STRATEGY_REVIEW);
    };

    const handleGenerateCharacterImage = useCallback(async (characterId: string) => {
        if (!currentProject || !checkApiKey()) return;
    
        const initialCharacter = currentProject.characters.find(c => c.id === characterId);
        if (!initialCharacter || !initialCharacter.consistencyString) {
            showNotification('Deskripsi karakter tidak ditemukan.', 'error');
            return;
        }
    
        const prompt = `cinematic photo, character concept art, ultra realistic, sharp focus, 8K, high detail. Medium close-up portrait of ${initialCharacter.consistencyString}. He or she has a neutral expression, looking directly at the camera. Photographed against a plain, out-of-focus studio background (neutral grey color). Lighting is soft and even professional studio lighting, highlighting facial features clearly.`;
    
        setCurrentProject(prev => {
            if (!prev) return null;
            const newCharacters = prev.characters.map(c =>
                c.id === characterId ? { ...c, isGeneratingImage: true, generationPrompt: prompt } : c
            );
            return { ...prev, characters: newCharacters, lastModified: Date.now() };
        });
    
        try {
            const imageUrl = await aiService.generateImageForScene(prompt, apiSettings);
            setCurrentProject(prev => {
                if (!prev) return null;
                const newCharacters = prev.characters.map(c =>
                    c.id === characterId ? { ...c, imageUrl, isGeneratingImage: false } : c
                );
                return { ...prev, characters: newCharacters, lastModified: Date.now() };
            });
            showNotification(`Gambar untuk karakter ${initialCharacter.name} berhasil dibuat!`, 'success');
        } catch (err) {
            handleApiError(err, `membuat gambar untuk ${initialCharacter.name}`);
            setCurrentProject(prev => {
                if (!prev) return null;
                const newCharacters = prev.characters.map(c =>
                    c.id === characterId ? { ...c, isGeneratingImage: false } : c
                );
                return { ...prev, characters: newCharacters, lastModified: Date.now() };
            });
        }
    }, [currentProject, checkApiKey, apiSettings, handleApiError, showNotification]);

    const handleCharactersConfirmed = useCallback(async (finalCharacters: Character[]) => {
        if (!currentProject?.script || currentProject.script.length === 0 || !checkApiKey()) return;
        updateProjectState({ characters: finalCharacters });
        try {
            const fullScript = currentProject.script.join('\n\n');
            setAndSaveAppState(AppState.GENERATING_SCENES);
            setProgressMessage('Membuat storyboard & prompt adegan...');
            const generatedScenesData = await aiService.generateStoryboard(fullScript, finalCharacters, currentProject.language, apiSettings);
            
            let shotCounter = 0;
            const scenesWithIds = generatedScenesData.map(scene => ({
                ...scene,
                shots: scene.shots.map(shot => ({
                    ...shot,
                    id: shotCounter++,
                })),
            }));

            updateProjectState({ scenes: scenesWithIds });
            setAndSaveAppState(AppState.EDITING);
        } catch (err) {
            handleApiError(err, 'membuat adegan storyboard');
            setAndSaveAppState(AppState.CHARACTER_REVIEW);
        }
    }, [currentProject, setAndSaveAppState, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleGenerateImage = useCallback(async (sceneName: string, shotId: number) => {
        if (!currentProject || !checkApiKey()) return;

        const updateShotState = (scenes: Scene[], updates: Partial<Shot>): Scene[] => {
            return scenes.map(scene => {
                if (scene.name === sceneName) {
                    return { ...scene, shots: scene.shots.map(shot => shot.id === shotId ? { ...shot, ...updates } : shot) };
                }
                return scene;
            });
        };

        const shot = currentProject.scenes.find(s => s.name === sceneName)?.shots.find(sh => sh.id === shotId);
        if (!shot) return;

        updateProjectState({ scenes: updateShotState(currentProject.scenes, { isGeneratingImage: true }) });

        try {
            const imageUrl = await aiService.generateImageForScene(shot.promptEn, apiSettings);
            updateProjectState({ scenes: updateShotState(currentProject.scenes, { imageUrl, isGeneratingImage: false }) });
            showNotification('Gambar berhasil dibuat!', 'success');
        } catch (err) {
            handleApiError(err, 'membuat gambar');
            updateProjectState({ scenes: updateShotState(currentProject.scenes, { isGeneratingImage: false }) });
        }
    }, [currentProject, updateProjectState, checkApiKey, apiSettings, handleApiError]);
    
    const handleImageUpload = useCallback((sceneName: string, shotId: number, file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            if (imageUrl && currentProject) {
                 const newScenes = currentProject.scenes.map(scene => {
                    if (scene.name === sceneName) {
                        return { ...scene, shots: scene.shots.map(shot => shot.id === shotId ? { ...shot, imageUrl, isGeneratingImage: false } : shot) };
                    }
                    return scene;
                });
                updateProjectState({ scenes: newScenes });
                showNotification('Gambar berhasil diunggah!', 'success');
            }
        };
        reader.onerror = () => showNotification('Gagal mengunggah gambar.', 'error');
        reader.readAsDataURL(file);
    }, [currentProject, showNotification, updateProjectState]);

    const handleProceedToAudio = useCallback(async () => {
        if (!currentProject?.script || !currentProject.characters || !checkApiKey()) return;
        setAndSaveAppState(AppState.GENERATING_AUDIO_PROMPTS);
        setProgressMessage('Membuat rekomendasi audio & prompt video...');
        try {
            const fullScript = currentProject.script.join('\n\n');
            const [recommendations, videoPromptsData] = await Promise.all([
                aiService.generateAudioRecommendations(fullScript, apiSettings),
                aiService.generateVideoPrompts(currentProject.scenes, currentProject.characters, currentProject.language, apiSettings)
            ]);
            
            const updatedScenes = currentProject.scenes.map(scene => {
                const matchingScenePrompts = videoPromptsData.find(p => p.name === scene.name);
                if (matchingScenePrompts && matchingScenePrompts.shots.length === scene.shots.length) {
                    const updatedShots = scene.shots.map((shot, index) => ({
                        ...shot,
                        videoPromptId: matchingScenePrompts.shots[index].videoPromptId,
                        videoPromptEn: matchingScenePrompts.shots[index].videoPromptEn,
                    }));
                    return { ...scene, shots: updatedShots };
                }
                console.warn(`Mismatch in number of shots for scene "${scene.name}". Video prompts not applied.`);
                return scene;
            });

            updateProjectState({ audioRecommendations: recommendations, scenes: updatedScenes });
            setAndSaveAppState(AppState.AUDIO_VIDEO_GENERATION);
        } catch(err) {
            handleApiError(err, 'memproses audio & video');
            setAndSaveAppState(AppState.EDITING);
        }
    }, [currentProject, setAndSaveAppState, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleRegenerateAudioRecommendations = useCallback(async () => {
        if (!currentProject?.script || !checkApiKey()) return;
        setIsRegeneratingAudio(true);
        try {
            const fullScript = currentProject.script.join('\n\n');
            const recommendations = await aiService.generateAudioRecommendations(fullScript, apiSettings);
            updateProjectState({ audioRecommendations: recommendations });
            showNotification('Rekomendasi audio berhasil diperbarui!', 'success');
        } catch (error) {
            handleApiError(error, 'membuat ulang rekomendasi audio');
        } finally {
            setIsRegeneratingAudio(false);
        }
    }, [currentProject?.script, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleGenerateVideo = useCallback(async (sceneName: string, shotId: number) => {
        if (!currentProject || !checkApiKey()) return;
       
        const updateShotState = (scenes: Scene[], updates: Partial<Shot>): Scene[] => {
            return scenes.map(scene => {
                if (scene.name === sceneName) {
                    return { ...scene, shots: scene.shots.map(shot => shot.id === shotId ? { ...shot, ...updates } : shot) };
                }
                return scene;
            });
        };

        const shot = currentProject.scenes.find(s => s.name === sceneName)?.shots.find(sh => sh.id === shotId);
        if (!shot || !shot.videoPromptEn) return;


        updateProjectState({ scenes: updateShotState(currentProject.scenes, { isGeneratingVideo: true }) });
        try {
            const videoUrl = await aiService.generateVideoForScene(shot.videoPromptEn, apiSettings);
            updateProjectState({ scenes: updateShotState(currentProject.scenes, { videoUrl, isGeneratingVideo: false }) });
            showNotification(`Video untuk shot di adegan "${sceneName}" berhasil dibuat!`, 'success');
        } catch (error) {
            handleApiError(error, `membuat video untuk adegan "${sceneName}"`);
            updateProjectState({ scenes: updateShotState(currentProject.scenes, { isGeneratingVideo: false }) });
        }
    }, [currentProject, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleProceedToMetadata = useCallback(async () => {
        if (!currentProject?.script || !currentProject?.characters || !currentProject.selectedTitle || !checkApiKey()) return;
        setAndSaveAppState(AppState.GENERATING_METADATA);
        setProgressMessage('Membuat metadata & ide thumbnail...');
        try {
            const fullScript = currentProject.script.join('\n\n');
            const [metadata, thumbnailPrompts] = await Promise.all([
                aiService.generateYoutubeMetadata(fullScript, apiSettings),
                aiService.generateThumbnailPrompts(fullScript, currentProject.characters, currentProject.selectedTitle, apiSettings)
            ]);
            
            const thumbnailOptions = thumbnailPrompts.map((prompt, index) => ({
                id: index,
                prompt: prompt,
            }));

            updateProjectState({ youtubeMetadata: metadata, thumbnailOptions: thumbnailOptions });
            setAndSaveAppState(AppState.METADATA_REVIEW);

        } catch (err) {
            handleApiError(err, 'membuat metadata');
            setAndSaveAppState(AppState.VIDEO_GENERATION);
        }
    }, [currentProject, setAndSaveAppState, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const handleGenerateThumbnail = useCallback(async (optionId: number, prompt: string) => {
        if (!currentProject || !checkApiKey()) return;
        
        const updateThumbnails = (isGenerating: boolean, imageUrl?: string) => {
             updateProjectState({ 
                thumbnailOptions: currentProject.thumbnailOptions?.map(opt => 
                    opt.id === optionId ? { ...opt, isGenerating, imageUrl: imageUrl !== undefined ? imageUrl : opt.imageUrl } : opt
                )
            });
        };

        updateThumbnails(true);

        try {
            const imageUrl = await aiService.generateImageForScene(prompt, apiSettings);
            updateThumbnails(false, imageUrl);
            showNotification('Thumbnail berhasil dibuat!', 'success');
        } catch (err) {
            handleApiError(err, 'membuat thumbnail');
            updateThumbnails(false);
        }
    }, [currentProject, updateProjectState, checkApiKey, apiSettings, handleApiError]);

    const renderContent = () => {
        if (!currentProject && appState !== AppState.PROJECT_SELECTOR) {
            goToProjectSelector();
            return null;
        }

        switch (appState) {
            case AppState.PROJECT_SELECTOR:
                return <ProjectSelector onNewProject={handleNewProject} onLoadProject={handleLoadProject} onOpenApiSettings={() => setIsApiSettingsOpen(true)} />;
            case AppState.IDEA_INPUT:
                return <IdeaInput onIdeaSubmit={handleIdeaSubmit} onScriptSubmit={handleScriptSubmit} onGenerateViralIdea={handleGenerateViralIdea} onBack={goToProjectSelector} />;
            case AppState.GENERATING_STRATEGY:
            case AppState.GENERATING_SCRIPT:
            case AppState.GENERATING_SCENES:
            case AppState.GENERATING_AUDIO_PROMPTS:
            case AppState.GENERATING_METADATA:
                return <GeneratingProgress customMessage={progressMessage} />;
            case AppState.STRATEGY_REVIEW:
                if (!currentProject?.synopsis || !currentProject?.titleOptions) {
                    goToProjectSelector();
                    return null;
                }
                return <StrategyReview
                    strategy={{
                        synopsis: currentProject.synopsis,
                        genre: currentProject.genre || 'Unknown',
                        targetAudience: currentProject.targetAudience || 'Unknown',
                        titleOptions: currentProject.titleOptions,
                    }}
                    onConfirm={handleStrategyConfirm}
                    onBack={() => setAndSaveAppState(AppState.IDEA_INPUT)}
                />;
            case AppState.SCRIPT_WRITING_ROOM:
                if (!currentProject) { 
                     goToProjectSelector();
                     return null;
                }
                return (
                    <ScriptWritingRoom
                        project={currentProject}
                        isGenerating={isGeneratingMoreScript}
                        onContinue={handleContinueScript}
                        onFinalize={handleScriptFinalized}
                        onBack={handleBackToStrategy}
                        onGenerateTts={handleGenerateTtsScript}
                        isGeneratingTts={isGeneratingTts}
                    />
                );
            case AppState.CHARACTER_REVIEW:
                return <ScenePromptRoom 
                            characters={currentProject!.characters} 
                            onConfirm={handleCharactersConfirmed} 
                            onBack={() => {
                                if (currentProject?.submissionType === 'script') {
                                    setAndSaveAppState(AppState.IDEA_INPUT)
                                } else {
                                    setAndSaveAppState(AppState.SCRIPT_WRITING_ROOM)
                                }
                            }}
                            onGenerateCharacterImage={handleGenerateCharacterImage}
                        />;
            case AppState.EDITING:
                 if (!currentProject) { 
                     goToProjectSelector();
                     return null;
                }
                return (
                    <StoryEditor
                        project={currentProject}
                        setScenes={(scenes) => updateProjectState({ scenes })}
                        onGenerateImage={handleGenerateImage}
                        onImageUpload={handleImageUpload}
                        onBack={() => setAndSaveAppState(AppState.CHARACTER_REVIEW)}
                        onProceedToAudio={handleProceedToAudio}
                    />
                );
            case AppState.AUDIO_VIDEO_GENERATION:
                 return (
                    <AudioVideoGenerator
                        scenes={currentProject!.scenes}
                        audioRecommendations={currentProject!.audioRecommendations}
                        onBack={() => setAndSaveAppState(AppState.EDITING)}
                        onFinalize={() => setAndSaveAppState(AppState.VIDEO_GENERATION)}
                        onRegenerateRecommendations={handleRegenerateAudioRecommendations}
                        isRegeneratingAudio={isRegeneratingAudio}
                     />
                 );
            case AppState.VIDEO_GENERATION:
                return (
                    <VideoGenerator
                        scenes={currentProject!.scenes}
                        setScenes={(scenes) => updateProjectState({ scenes })}
                        onGenerateVideo={handleGenerateVideo}
                        onBack={() => setAndSaveAppState(AppState.AUDIO_VIDEO_GENERATION)}
                        onFinalize={handleProceedToMetadata}
                    />
                );
             case AppState.METADATA_REVIEW:
                if (!currentProject?.youtubeMetadata || !currentProject?.thumbnailOptions) {
                    goToProjectSelector();
                    return null;
                }
                return (
                    <MetadataGenerator
                        metadata={currentProject.youtubeMetadata}
                        setMetadata={(metadata) => updateProjectState({ youtubeMetadata: metadata })}
                        thumbnailOptions={currentProject.thumbnailOptions}
                        onGenerateThumbnail={handleGenerateThumbnail}
                        onBack={() => setAndSaveAppState(AppState.VIDEO_GENERATION)}
                        onFinalize={() => setAndSaveAppState(AppState.VIDEO_PREVIEW)}
                    />
                );
            case AppState.VIDEO_PREVIEW:
                 return <VideoPreview scenes={currentProject!.scenes} onGoToProjects={goToProjectSelector} onBack={() => setAndSaveAppState(AppState.METADATA_REVIEW)} />;
            default:
                return <ProjectSelector onNewProject={handleNewProject} onLoadProject={handleLoadProject} onOpenApiSettings={() => setIsApiSettingsOpen(true)} />;
        }
    };

    return (
        <div className="min-h-screen bg-brand-gray-900 font-sans flex flex-col">
            <Header isProjectActive={!!currentProject} onGoToProjects={goToProjectSelector} onSaveProject={handleSaveProject} />
            <main className="flex-grow flex flex-col justify-center py-8">
                <div className="container mx-auto px-4">
                    {renderContent()}
                </div>
            </main>
            <ApiSettingsModal 
                isOpen={isApiSettingsOpen} 
                onClose={() => setIsApiSettingsOpen(false)}
                currentSettings={apiSettings}
                onSave={handleSaveApiSettings}
            />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <NotificationProvider>
            <AppContent />
            <Notification />
        </NotificationProvider>
    );
};

export default App;
