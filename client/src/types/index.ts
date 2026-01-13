export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  boardId: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  user: User;
}

export interface PropertyOption {
  id: string;
  value: string;
  color: string;
}

export interface CardProperty {
  id: string;
  name: string;
  type: 'select' | 'text' | 'date' | 'number' | 'url' | 'multiPerson' | 'createdBy' | 'createdTime' | 'updatedBy' | 'updatedTime';
  options: PropertyOption[];
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  showDescription: boolean;
  properties: CardProperty[];
  createdAt: string;
  updatedAt: string;
  members: BoardMember[];
  cards?: Card[];
  views?: View[];
  _count?: { cards: number };
}

export interface Card {
  id: string;
  title: string;
  content?: string;
  properties: Record<string, string>;
  icon?: string;
  order: number;
  parentId?: string;
  boardId: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface View {
  id: string;
  title: string;
  type: 'BOARD' | 'TABLE' | 'CALENDAR' | 'GALLERY';
  parentId?: string;
  filter: Record<string, unknown>;
  sortOptions: Array<{ propertyId: string; reversed: boolean }>;
  visiblePropertyIds: string[];
  columnWidths: Record<string, number>;
  kanbanCalculations: Record<string, unknown>;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
}
