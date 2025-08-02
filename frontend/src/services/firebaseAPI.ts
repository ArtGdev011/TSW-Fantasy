// Firebase API Service for TSW Fantasy League Frontend
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc 
} from "firebase/firestore";
import { db, COLLECTIONS } from '../config/firebase.js';

// Types
export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'CDM' | 'LW' | 'RW';
  rating: number;
  price: number;
  team: string;
  points: number;
  gamesPlayed: number;
  isAvailable: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  role: 'user' | 'admin';
}

export interface Team {
  id: string;
  name: string;
  userId: string;
  players: {
    gk: string;
    cdm1: string;
    cdm2: string;
    lw: string;
    rw: string;
  };
  substitutes: {
    sub1: string;
    sub2: string;
    sub3: string;
  };
  captain: string;
  viceCaptain: string;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamCreateRequest {
  name: string;
  players: {
    gk: string;
    cdm1: string;
    cdm2: string;
    lw: string;
    rw: string;
  };
  substitutes: {
    sub1: string;
    sub2: string;
    sub3: string;
  };
  captain: string;
  viceCaptain: string;
}

// Auth API - Firebase based
export const authAPI = {
  signup: async (userData: { username: string; password: string; email: string }) => {
    try {
      const userId = userData.username.toLowerCase();
      
      // Check if user already exists
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        throw new Error('Username already exists');
      }

      // Create user document
      await setDoc(doc(db, COLLECTIONS.USERS, userId), {
        username: userData.username,
        email: userData.email,
        password: userData.password, // Note: In production, hash this on backend
        createdAt: new Date(),
        lastLogin: null,
        isActive: true,
        role: 'user'
      });

      return { 
        message: 'User created successfully',
        user: { id: userId, username: userData.username, email: userData.email }
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  login: async (credentials: { username: string; password: string }) => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, credentials.username.toLowerCase()));
      
      if (!userDoc.exists()) {
        throw new Error('Invalid credentials');
      }

      const user = userDoc.data();
      // Note: In production, verify password hash
      if (user.password !== credentials.password) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await updateDoc(doc(db, COLLECTIONS.USERS, credentials.username.toLowerCase()), {
        lastLogin: new Date()
      });

      return { 
        message: 'Login successful',
        user: { 
          id: userDoc.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        }
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  logout: async () => {
    // Firebase handles logout automatically
    return { message: 'Logged out successfully' };
  },

  verify: async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const user = userDoc.data();
      return { 
        user: { 
          id: userDoc.id, 
          username: user.username, 
          email: user.email,
          role: user.role 
        }
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};

// Players API - Firebase based
export const playersAPI = {
  getAll: async (): Promise<{ players: Player[] }> => {
    try {
      const q = query(collection(db, COLLECTIONS.PLAYERS), orderBy("rating", "desc"));
      const querySnapshot = await getDocs(q);
      
      const players = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];

      return { players };
    } catch (error: any) {
      throw new Error(`Failed to fetch players: ${error.message}`);
    }
  },

  getAvailable: async (): Promise<{ players: Player[] }> => {
    try {
      const q = query(
        collection(db, COLLECTIONS.PLAYERS), 
        where("isAvailable", "==", true),
        orderBy("rating", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const players = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];

      return { players };
    } catch (error: any) {
      throw new Error(`Failed to fetch available players: ${error.message}`);
    }
  },

  getById: async (playerId: string): Promise<{ player: Player }> => {
    try {
      const playerDoc = await getDoc(doc(db, COLLECTIONS.PLAYERS, playerId));
      
      if (!playerDoc.exists()) {
        throw new Error('Player not found');
      }

      const player = {
        id: playerDoc.id,
        ...playerDoc.data()
      } as Player;

      return { player };
    } catch (error: any) {
      throw new Error(`Failed to fetch player: ${error.message}`);
    }
  }
};

// Teams API - Firebase based
export const teamAPI = {
  create: async (teamData: TeamCreateRequest, userId: string): Promise<{ message: string; team: Team }> => {
    try {
      const teamId = `${userId}_${Date.now()}`;
      
      const team = {
        id: teamId,
        ...teamData,
        userId,
        totalPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, COLLECTIONS.TEAMS, teamId), team);

      return { 
        message: 'Team created successfully',
        team: team as Team
      };
    } catch (error: any) {
      throw new Error(`Failed to create team: ${error.message}`);
    }
  },

  getUserTeams: async (userId: string): Promise<{ teams: Team[] }> => {
    try {
      const q = query(
        collection(db, COLLECTIONS.TEAMS), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const teams = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];

      return { teams };
    } catch (error: any) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }
  },

  update: async (teamId: string, updateData: Partial<Team>): Promise<{ message: string }> => {
    try {
      await updateDoc(doc(db, COLLECTIONS.TEAMS, teamId), {
        ...updateData,
        updatedAt: new Date()
      });

      return { message: 'Team updated successfully' };
    } catch (error: any) {
      throw new Error(`Failed to update team: ${error.message}`);
    }
  },

  delete: async (teamId: string): Promise<{ message: string }> => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.TEAMS, teamId));
      return { message: 'Team deleted successfully' };
    } catch (error: any) {
      throw new Error(`Failed to delete team: ${error.message}`);
    }
  }
};

export default {
  authAPI,
  playersAPI,
  teamAPI
};
