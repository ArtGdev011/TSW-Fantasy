// IndexedDB Service for TSW Fantasy League
// Replaces Firebase for local data storage

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Will be hashed
  budget: number;
  totalPoints: number;
  gameweekPoints: number;
  rank: number;
  createdAt: Date;
  lastActive: Date;
  isAdmin: boolean;
  hasTeam: boolean;
  teamId?: string;
  profileImage?: string;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
  };
}

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  rating: number;
  price: number;
  team: string;
  points: number;
  gameweekPoints: number;
  gamesPlayed: number;
  isAvailable: boolean;
  ownerId?: string; // User ID who owns this player
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  userId: string;
  players: string[]; // Array of player IDs
  captain: string; // Player ID
  viceCaptain: string; // Player ID
  formation: string;
  budget: number;
  teamValue: number;
  points: number;
  gameweekPoints: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inbox {
  id: string;
  userId: string;
  subject: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'transfer' | 'system';
  isRead: boolean;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: 'bug' | 'feature' | 'support' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

class IndexedDBService {
  private dbName = 'TSWFantasyDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
          userStore.createIndex('email', 'email', { unique: true });
        }

        if (!db.objectStoreNames.contains('players')) {
          const playerStore = db.createObjectStore('players', { keyPath: 'id' });
          playerStore.createIndex('name', 'name');
          playerStore.createIndex('position', 'position');
          playerStore.createIndex('team', 'team');
          playerStore.createIndex('ownerId', 'ownerId');
        }

        if (!db.objectStoreNames.contains('teams')) {
          const teamStore = db.createObjectStore('teams', { keyPath: 'id' });
          teamStore.createIndex('userId', 'userId', { unique: true });
          teamStore.createIndex('name', 'name');
        }

        if (!db.objectStoreNames.contains('inbox')) {
          const inboxStore = db.createObjectStore('inbox', { keyPath: 'id' });
          inboxStore.createIndex('userId', 'userId');
          inboxStore.createIndex('createdAt', 'createdAt');
        }

        if (!db.objectStoreNames.contains('tickets')) {
          const ticketStore = db.createObjectStore('tickets', { keyPath: 'id' });
          ticketStore.createIndex('userId', 'userId');
          ticketStore.createIndex('status', 'status');
          ticketStore.createIndex('createdAt', 'createdAt');
        }

        console.log('✅ IndexedDB object stores created');
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // Generic CRUD operations
  private async add<T>(storeName: string, data: T): Promise<T> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async update<T>(storeName: string, data: T): Promise<T> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    
    return new Promise((resolve, reject) => {
      const request = index.get(value);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>): Promise<User> {
    const user: User = {
      id: userData.username.toLowerCase(),
      ...userData,
      createdAt: new Date(),
      lastActive: new Date(),
    };
    
    return this.add('users', user);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.get<User>('users', id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.getByIndex<User>('users', 'username', username);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.getByIndex<User>('users', 'email', email);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...existingUser, ...updates, lastActive: new Date() };
    return this.update('users', updatedUser);
  }

  async getAllUsers(): Promise<User[]> {
    return this.getAll<User>('users');
  }

  // Player operations
  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    const player: Player = {
      id: playerData.name.toLowerCase().replace(/\s+/g, '-'),
      ...playerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return this.add('players', player);
  }

  async getPlayerById(id: string): Promise<Player | null> {
    return this.get<Player>('players', id);
  }

  async getAllPlayers(): Promise<Player[]> {
    return this.getAll<Player>('players');
  }

  async getPlayersByPosition(position: string): Promise<Player[]> {
    return this.getAllByIndex<Player>('players', 'position', position);
  }

  async getPlayersByTeam(team: string): Promise<Player[]> {
    return this.getAllByIndex<Player>('players', 'team', team);
  }

  async getPlayersByOwner(ownerId: string): Promise<Player[]> {
    return this.getAllByIndex<Player>('players', 'ownerId', ownerId);
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const existingPlayer = await this.getPlayerById(id);
    if (!existingPlayer) {
      throw new Error('Player not found');
    }
    
    const updatedPlayer = { ...existingPlayer, ...updates, updatedAt: new Date() };
    return this.update('players', updatedPlayer);
  }

  // Team operations
  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const team: Team = {
      id: `${teamData.userId}-${teamData.name.toLowerCase().replace(/\s+/g, '-')}`,
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return this.add('teams', team);
  }

  async getTeamById(id: string): Promise<Team | null> {
    return this.get<Team>('teams', id);
  }

  async getTeamByUserId(userId: string): Promise<Team | null> {
    return this.getByIndex<Team>('teams', 'userId', userId);
  }

  async getAllTeams(): Promise<Team[]> {
    return this.getAll<Team>('teams');
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const existingTeam = await this.getTeamById(id);
    if (!existingTeam) {
      throw new Error('Team not found');
    }
    
    const updatedTeam = { ...existingTeam, ...updates, updatedAt: new Date() };
    return this.update('teams', updatedTeam);
  }

  async deleteTeam(id: string): Promise<void> {
    return this.delete('teams', id);
  }

  // Inbox operations
  async createInboxMessage(messageData: Omit<Inbox, 'id' | 'createdAt'>): Promise<Inbox> {
    const message: Inbox = {
      id: `${messageData.userId}-${Date.now()}`,
      ...messageData,
      createdAt: new Date(),
    };
    
    return this.add('inbox', message);
  }

  async getInboxByUserId(userId: string): Promise<Inbox[]> {
    return this.getAllByIndex<Inbox>('inbox', 'userId', userId);
  }

  async updateInboxMessage(id: string, updates: Partial<Inbox>): Promise<Inbox> {
    const existingMessage = await this.get<Inbox>('inbox', id);
    if (!existingMessage) {
      throw new Error('Inbox message not found');
    }
    
    const updatedMessage = { ...existingMessage, ...updates };
    return this.update('inbox', updatedMessage);
  }

  async deleteInboxMessage(id: string): Promise<void> {
    return this.delete('inbox', id);
  }

  // Ticket operations
  async createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const ticket: Ticket = {
      id: `ticket-${Date.now()}`,
      ...ticketData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return this.add('tickets', ticket);
  }

  async getTicketsByUserId(userId: string): Promise<Ticket[]> {
    return this.getAllByIndex<Ticket>('tickets', 'userId', userId);
  }

  async getAllTickets(): Promise<Ticket[]> {
    return this.getAll<Ticket>('tickets');
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const existingTicket = await this.get<Ticket>('tickets', id);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }
    
    const updatedTicket = { ...existingTicket, ...updates, updatedAt: new Date() };
    return this.update('tickets', updatedTicket);
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = ['users', 'players', 'teams', 'inbox', 'tickets'];
    
    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('✅ All IndexedDB data cleared');
  }

  async exportData(): Promise<any> {
    const users = await this.getAllUsers();
    const players = await this.getAllPlayers();
    const teams = await this.getAllTeams();
    const inbox = await this.getAll<Inbox>('inbox');
    const tickets = await this.getAllTickets();
    
    return {
      users,
      players,
      teams,
      inbox,
      tickets,
      exportedAt: new Date().toISOString(),
    };
  }

  async importData(data: any): Promise<void> {
    // Clear existing data first
    await this.clearAllData();
    
    // Import users
    if (data.users) {
      for (const user of data.users) {
        await this.add('users', user);
      }
    }
    
    // Import players
    if (data.players) {
      for (const player of data.players) {
        await this.add('players', player);
      }
    }
    
    // Import teams
    if (data.teams) {
      for (const team of data.teams) {
        await this.add('teams', team);
      }
    }
    
    // Import inbox
    if (data.inbox) {
      for (const message of data.inbox) {
        await this.add('inbox', message);
      }
    }
    
    // Import tickets
    if (data.tickets) {
      for (const ticket of data.tickets) {
        await this.add('tickets', ticket);
      }
    }
    
    console.log('✅ Data imported successfully');
  }
}

// Export singleton instance
export const dbService = new IndexedDBService();
export default dbService;
