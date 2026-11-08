export type ToolStatus = 'available' | 'lent';

export type ToolCategory = 'tools' | 'garden' | 'kitchen';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export type RequestDay = 'today' | 'yesterday';

export type ChatRole = 'assistant' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUri?: string;
}

export interface Tool {
  id: string;
  name: string;
  ownerName: string;
  distanceBlocks: number;
  status: ToolStatus;
  category: ToolCategory;
}

export interface ProjectRequiredTool {
  id: string;
  name: string;
  toolId?: string;
}

export interface Project {
  id: string;
  title: string;
  requiredTools: ProjectRequiredTool[];
}

export interface ToolRequest {
  id: string;
  requesterName: string;
  toolName: string;
  day: RequestDay;
  time: string;
  status: RequestStatus;
}

export interface CompletedWork {
  id: string;
  title: string;
  completedDaysAgo: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}
