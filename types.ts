export enum AppStep {
  LANDING = 'LANDING',
  IDEA = 'IDEA',
  TEAM = 'TEAM',
  ROADMAP = 'ROADMAP',
  DASHBOARD = 'DASHBOARD'
}

export enum DashboardTab {
  TRACKER = 'TRACKER',
  MENTOR = 'MENTOR',
  CODE = 'CODE'
}

export interface ProjectIdea {
  title: string;
  problem: string;
  targetAudience: string;
  coreFeatures: string[];
  techStackRecommendation?: string[];
  developerPreferences?: string;
}

export interface TeamRole {
  roleName: string;
  responsibilities: string[];
  skills: string[];
}

export interface TeamPlan {
  isSolo: boolean;
  roles: TeamRole[];
}

export interface RoadmapTask {
  id: string;
  time: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface RoadmapPhase {
  phaseName: string;
  duration: string;
  tasks: RoadmapTask[];
}

export interface AppState {
  currentStep: AppStep;
  projectIdea: ProjectIdea | null;
  teamPlan: TeamPlan | null;
  roadmap: RoadmapPhase[];
  hackathonDuration: '24h' | '48h';
  customApiKey: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}