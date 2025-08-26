
export enum AppState {
    PROJECT_SELECTOR,
    IDEA_INPUT,
    GENERATING_STRATEGY,
    STRATEGY_REVIEW,
    GENERATING_SCRIPT,
    SCRIPT_WRITING_ROOM,
    CHARACTER_REVIEW,
    GENERATING_SCENES,
    EDITING,
    GENERATING_AUDIO_PROMPTS,
    AUDIO_VIDEO_GENERATION,
    VIDEO_GENERATION,
    GENERATING_METADATA,
    METADATA_REVIEW,
    VIDEO_PREVIEW,
}

export type StoryStyle = 'drama-realistis' | 'thriller-psikologis' | 'petualangan-fantasi';
export type AiProvider = 'gemini' | 'groq' | 'openai';

export interface Shot {
    id: number;
    promptId: string;
    promptEn: string;
    videoPromptId?: string;
    videoPromptEn?: string;
    narration: string;
    imageUrl?: string;
    isGeneratingImage?: boolean;
    videoUrl?: string;
    isGeneratingVideo?: boolean;
}

export interface Scene {
    name: string;
    shots: Shot[];
}

export interface AudioRecommendations {
    bgm: string[];
    sfx: string[];
    bgmKeywords: string[];
    sfxKeywords: string[];
}

export interface CharacterDescription {
    gender: string;
    age: string;
    bodyType: string;
    hair: string;
    skinTone: string;
    outfit: string;
}

export interface Character {
    id: string;
    name: string;
    description: CharacterDescription;
    consistencyString: string;
    generationPrompt?: string;
    imageUrl?: string;
    isGeneratingImage?: boolean;
}

export interface YoutubeMetadata {
    title: string;
    description: string;
    hashtags: string[];
    alternativeTitles: string[];
}

export interface ThumbnailOption {
    id: number;
    prompt: string;
    imageUrl?: string;
    isGenerating?: boolean;
}

export interface ApiSettings {
    provider: AiProvider;
    keys: {
        gemini: string;
        groq: string;
        openai: string;
    };
}

export interface Project {
    id: string;
    name: string;
    lastModified: number;
    appState: AppState;
    storyIdea: string;
    language: 'indonesian' | 'english';
    storyStyle: StoryStyle;
    duration: number;
    submissionType?: 'idea' | 'script';
    synopsis?: string;
    genre?: string;
    targetAudience?: string;
    titleOptions?: string[];
    selectedTitle?: string;
    script: string[];
    ttsScript?: string;
    generatedEpisodes?: number;
    characters: Character[];
    scenes: Scene[];
    audioRecommendations: AudioRecommendations | null;
    youtubeMetadata?: YoutubeMetadata | null;
    thumbnailOptions?: ThumbnailOption[];
}
