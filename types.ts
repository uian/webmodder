export enum ModType {
  CHROME_EXTENSION = 'CHROME_EXTENSION',
  USER_SCRIPT = 'USER_SCRIPT',
  CSS_ONLY = 'CSS_ONLY'
}

export enum AppMode {
  GENERATOR = 'GENERATOR',
  INSPECTOR = 'INSPECTOR'
}

export interface GeneratedFile {
  name: string;
  language: 'json' | 'javascript' | 'css' | 'html' | 'markdown' | 'plaintext';
  content: string;
}

export interface ModificationProject {
  id: string;
  title: string;
  files: GeneratedFile[];
  explanation: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  images?: string[]; // base64 strings
  projectId?: string; // Links to a generated project if applicable
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface MockSite {
  url: string;
  title: string;
  html: string;
}