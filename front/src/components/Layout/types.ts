export enum Model {
  Ollama = "ollama",
  Groq = "groq",
  MULTI_LAYER = "multi-layer-ml-model",
}

export enum PageTitle {
  CHAT = "Chat",
  EDITOR = "Editor",
  MoreOptions = "More Options",
  GitHubAuth = "GitHub Authentication",
  ContextualResponse = "Contextual Response",
}

export const supported_language_versions = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  php: "8.2.3",
};

export enum RequestStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS'
}

export interface ApiResponse<T = unknown> {
  status: RequestStatus;
  message?: string;
  data?: T;
} 
