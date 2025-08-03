import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config - session-based auth
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for session-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session-based auth - no localStorage needed
api.interceptors.request.use((config) => {
  // Backend handles session via cookies, no manual token needed
  return config;
});

// Handle auth errors - session-based
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  team?: string;
  teamName?: string;
  budget?: number;
  totalPoints?: number;
  rank?: number;
  leagues?: string[];
  preferences?: {
    notifications: boolean;
    theme: 'dark' | 'light';
    language: string;
  };
  stats?: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
  };
  lastActive?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Player {
  _id: string;
  name: string;
  position: 'GK' | 'CDM' | 'LW' | 'RW';
  region: 'NA' | 'EU';
  price: number; // Price in millions
  overall: number; // Overall rating
  owner?: string; // User ID who owns this player
  isOwned: boolean; // Helper field for frontend
  weeklyStats?: {
    goals: number;
    assists: number;
    saves: number;
    cleanSheets: number;
    ownGoals: number;
    points: number;
  };
  seasonStats?: {
    appearances: number;
    goals: number;
    assists: number;
    saves: number;
    cleanSheets: number;
    ownGoals: number;
    points: number;
  };
}

export interface Team {
  _id: string;
  user: string;
  name: string;
  players: {
    gk: Player;
    cdm1: Player;
    cdm2: Player;
    lw: Player;
    rw: Player;
  };
  substitutes: {
    sub1: Player;
    sub2: Player;
    sub3: Player;
  };
  captain: Player;
  viceCaptain: Player;
  totalValue: number; // Total cost of all players including subs
  budgetRemaining: number; // 150M - totalValue
  overallRating: number; // Average of all players
  gameweekPoints: number;
  totalPoints: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Game Rules Constants
export const GAME_RULES = {
  STARTING_BUDGET: 300, // 300 million
  TEAM_COMPOSITION: {
    GK: 1,
    CDM: 2,
    WINGERS: 2, // LW + RW (can mix positions)
    SUBSTITUTES: 3, // 3 substitute players
  },
  MIN_PLAYERS: 8, // 5 starting + 3 subs
  MAX_PLAYERS: 8,
};

export interface PlayersResponse {
  players: Player[];
  total: number;
  budgetRemaining?: number;
}

export interface TeamCreateRequest {
  name: string;
  players: {
    gk: string; // Player ID
    cdm1: string;
    cdm2: string;
    lw: string; // Can be LW or RW
    rw: string; // Can be LW or RW
  };
  substitutes: {
    sub1: string; // Player ID
    sub2: string;
    sub3: string;
  };
  captain: string; // Player ID
  viceCaptain: string; // Player ID
}

// Auth API - MongoDB only
export const authAPI = {
  signup: async (userData: { 
    username: string; 
    password: string; 
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Signup failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
      throw new Error(errorMessage);
    }
  },

  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  verify: async (): Promise<{ valid: boolean; user: User }> => {
    try {
      const response = await api.post('/auth/verify');
      return response.data;
    } catch (error: any) {
      console.error('❌ Token verification failed:', error);
      return { valid: false, user: {} as User };
    }
  },

  updateProfile: async (updates: Partial<User>): Promise<{ user: User }> => {
    try {
      const response = await api.put('/auth/profile', updates);
      return response.data;
    } catch (error: any) {
      console.error('❌ Profile update failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      throw new Error(errorMessage);
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Token refresh failed';
      throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      console.error('❌ Logout failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Logout failed';
      throw new Error(errorMessage);
    }
  }
};

// Players API
export const playersAPI = {
  // Get all available players with ownership status from MongoDB
  getAvailable: async (): Promise<PlayersResponse> => {
    try {
      const response = await api.get('/players');
      
      // No client-side tracking - get ownership directly from backend
      return {
        players: response.data.players,
        total: response.data.total
      };
    } catch (error) {
      console.error('Failed to fetch players from API:', error);
      
      // Fallback: return empty state
      return {
        players: [],
        total: 0
      };
    }
  },

  // Get players by position from MongoDB
  getByPosition: async (position: string): Promise<{ players: Player[] }> => {
    try {
      const response = await api.get(`/players/position/${position}`);
      
      // No client-side tracking - get ownership directly from backend
      return { players: response.data.players };
    } catch (error) {
      console.error('Failed to fetch players by position:', error);
      return { players: [] };
    }
  },

  // Search players by name from MongoDB
  search: async (query: string): Promise<{ players: Player[] }> => {
    try {
      const response = await api.get(`/players/search/${encodeURIComponent(query)}`);
      
      // No client-side tracking - get ownership directly from backend
      return { players: response.data.results };
    } catch (error) {
      console.error('Failed to search players:', error);
      return { players: [] };
    }
  },

  // Get player by ID from MongoDB
  getById: async (id: string): Promise<{ player: Player }> => {
    try {
      const response = await api.get(`/players/${id}`);
      
      // No client-side tracking - get ownership directly from backend
      return { player: response.data.player };
    } catch (error) {
      console.error('Failed to fetch player by ID:', error);
      throw new Error('Player not found');
    }
  },
};

// Team API
export const teamAPI = {

  // Create new team - use MongoDB only (no localStorage)
  create: async (teamData: TeamCreateRequest): Promise<{ team: Team; message: string }> => {
    try {
      console.log('🚀 Creating team via MongoDB API...');
      const response = await api.post('/team', teamData);
      console.log('✅ Team created successfully via API');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create team via API:', error);
      
      // Show proper error instead of localStorage fallback
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create team';
      throw new Error(errorMessage);
    }
  },

  // Get current user's team - from MongoDB only
  get: async (): Promise<{ team: Team | null }> => {
    try {
      const response = await api.get('/team');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get team from API:', error);
      // Return null instead of checking localStorage
      return { team: null };
    }
  },

  // Update captain/vice-captain - MongoDB only
  updateCaptains: async (captain: string, viceCaptain: string): Promise<{ team: Team; message: string }> => {
    try {
      const response = await api.patch('/team/captains', { captain, viceCaptain });
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update captains via API:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update captains';
      throw new Error(errorMessage);
    }
  },

  // Get dashboard data - MongoDB only
  getDashboard: async (): Promise<{
    team: Team | null;
    hasTeam: boolean;
    gameweek: number;
    nextDeadline: string;
    leaderboardPosition: number;
  }> => {
    try {
      const response = await api.get('/team/dashboard');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to load dashboard:', error);
      
      // Return empty state instead of localStorage fallback
      return {
        team: null,
        hasTeam: false,
        gameweek: 1,
        nextDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        leaderboardPosition: 0
      };
    }
  },
};

// Chips API
export const chipsAPI = {
  getAvailable: async (): Promise<{
    chips: Array<{
      type: string;
      name: string;
      description: string;
      used: boolean;
      canUse: boolean;
      isActive: boolean;
    }>;
    activeChip?: string;
    availableCount: number;
  }> => {
    const response = await api.get('/chips/available');
    return response.data;
  },

  use: async (chipType: string): Promise<{ message: string; chip: any; team: any }> => {
    const response = await api.post('/chips/use', { chipType });
    return response.data;
  },

  getHistory: async (): Promise<{
    usedChips: Array<{
      type: string;
      name: string;
      description: string;
      usedAt: string;
    }>;
    totalUsed: number;
    remaining: number;
  }> => {
    const response = await api.get('/chips/history');
    return response.data;
  },
};

// Public API
export const publicAPI = {
  getHealth: async (): Promise<{
    status: string;
    timestamp: string;
    version: string;
    environment: string;
    gameweek: number;
    uptime: number;
  }> => {
    const response = await api.get('/health');
    return response.data;
  },

  getGameInfo: async (): Promise<{
    gameweek: number;
    isLocked: boolean;
    lockReason?: string;
    timeUntilDeadline: string;
    season: string;
  }> => {
    const response = await api.get('/game-info');
    return response.data;
  },

  getLeaderboard: async (): Promise<{
    teams: Array<{
      _id: string;
      name: string;
      user: { username: string };
      totalPoints: number;
      gameweekPoints: number;
    }>;
    total: number;
    page: number;
  }> => {
    const response = await api.get('/leaderboard');
    return response.data;
  },
};

export default api;
