import { Project } from '../types';

const PROJECT_LIBRARY_KEY = 'narratifAiProjectLibrary';

export const getProjects = (): Project[] => {
    try {
        const projectsJson = localStorage.getItem(PROJECT_LIBRARY_KEY);
        if (!projectsJson) return [];
        const projects = JSON.parse(projectsJson) as Project[];
        return projects.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
        console.error("Failed to load projects from localStorage:", error);
        return [];
    }
};

export const saveProject = (project: Project): void => {
    try {
        const projects = getProjects();
        const existingIndex = projects.findIndex(p => p.id === project.id);
        if (existingIndex > -1) {
            projects[existingIndex] = project;
        } else {
            projects.unshift(project); // Add to the beginning
        }
        localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify(projects));
    } catch (error) {
        console.error("Failed to save project to localStorage:", error);
    }
};

export const deleteProject = (projectId: string): void => {
    try {
        let projects = getProjects();
        projects = projects.filter(p => p.id !== projectId);
        localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify(projects));
    } catch (error) {
        console.error("Failed to delete project from localStorage:", error);
    }
};
