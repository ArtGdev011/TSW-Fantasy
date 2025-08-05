// Local Authentication Service with IndexedDB
// Replaces Firebase Auth for local authentication

import { dbService, User } from './indexedDB';
import bcrypt from 'bcryptjs'; // Use bcryptjs for browser compatibility

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  budget: number;
  totalPoints: number;
  gameweekPoints: number;
  rank: number;
  isAdmin: boolean;
  hasTeam: boolean;
  teamId?: string;
  createdAt: Date;
  lastActive: Date;
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
  };
}

class LocalAuthService {
  private currentUser: AuthUser | null = null;
  private authToken: string | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    // Check for existing session
    const savedToken = localStorage.getItem('tsw_auth_token');
    const savedUserId = localStorage.getItem('tsw_user_id');
    
    if (savedToken && savedUserId) {
      try {
        const user = await dbService.getUserById(savedUserId);
        if (user && this.validateToken(savedToken, user)) {
          this.currentUser = this.mapUserToAuthUser(user);
          this.authToken = savedToken;
          this.notifyListeners();
          
          // Update last active
          await dbService.updateUser(user.id, { lastActive: new Date() });
        } else {
          this.clearSession();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.clearSession();
      }
    }
  }

  private generateToken(user: User): string {
    // Simple token generation - in production, use JWT
    const payload = {
      userId: user.id,
      username: user.username,
      timestamp: Date.now(),
    };
    return btoa(JSON.stringify(payload));
  }

  private validateToken(token: string, user: User): boolean {
    try {
      const payload = JSON.parse(atob(token));
      return payload.userId === user.id && payload.username === user.username;
    } catch {
      return false;
    }
  }

  private mapUserToAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      budget: user.budget,
      totalPoints: user.totalPoints,
      gameweekPoints: user.gameweekPoints,
      rank: user.rank,
      isAdmin: user.isAdmin,
      hasTeam: user.hasTeam,
      teamId: user.teamId,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      preferences: user.preferences,
    };
  }

  private saveSession(user: User, token: string) {
    localStorage.setItem('tsw_auth_token', token);
    localStorage.setItem('tsw_user_id', user.id);
    localStorage.setItem('tsw_username', user.username);
  }

  private clearSession() {
    localStorage.removeItem('tsw_auth_token');
    localStorage.removeItem('tsw_user_id');
    localStorage.removeItem('tsw_username');
    this.currentUser = null;
    this.authToken = null;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Public methods
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signup(data: SignupData): Promise<AuthUser> {
    const { username, email, password } = data;

    // Validation
    if (!username || !email || !password) {
      throw new Error('All fields are required');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    // Check if username already exists
    const existingUserByUsername = await dbService.getUserByUsername(username);
    if (existingUserByUsername) {
      throw new Error('Username already exists. Please choose a different username.');
    }

    // Check if email already exists
    const existingUserByEmail = await dbService.getUserByEmail(email);
    if (existingUserByEmail) {
      throw new Error('Email already exists. Please use a different email.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData = {
      username,
      email,
      password: hashedPassword,
      budget: 300000000, // £300M starting budget
      totalPoints: 0,
      gameweekPoints: 0,
      rank: 0,
      isAdmin: false,
      hasTeam: false,
      preferences: {
        notifications: true,
        emailUpdates: true,
      },
    };

    const user = await dbService.createUser(userData);
    
    // Generate token and save session
    const token = this.generateToken(user);
    this.saveSession(user, token);
    
    // Set current user
    this.currentUser = this.mapUserToAuthUser(user);
    this.authToken = token;
    
    // Notify listeners
    this.notifyListeners();
    
    console.log(`✅ User ${username} signed up successfully`);
    return this.currentUser;
  }

  async login(data: LoginData): Promise<AuthUser> {
    const { username, password } = data;

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Find user by username
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Update last active
    await dbService.updateUser(user.id, { lastActive: new Date() });
    const updatedUser = await dbService.getUserById(user.id);
    
    // Generate token and save session
    const token = this.generateToken(updatedUser!);
    this.saveSession(updatedUser!, token);
    
    // Set current user
    this.currentUser = this.mapUserToAuthUser(updatedUser!);
    this.authToken = token;
    
    // Notify listeners
    this.notifyListeners();
    
    console.log(`✅ User ${username} logged in successfully`);
    return this.currentUser;
  }

  async logout(): Promise<void> {
    this.clearSession();
    this.notifyListeners();
    console.log('✅ User logged out successfully');
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  async updateUser(updates: Partial<User>): Promise<AuthUser> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    const updatedUser = await dbService.updateUser(this.currentUser.id, updates);
    this.currentUser = this.mapUserToAuthUser(updatedUser);
    
    // Notify listeners
    this.notifyListeners();
    
    return this.currentUser;
  }

  async deleteAccount(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    // Delete user's team if exists
    if (this.currentUser.hasTeam && this.currentUser.teamId) {
      await dbService.deleteTeam(this.currentUser.teamId);
    }

    // Delete user's inbox messages
    const inboxMessages = await dbService.getInboxByUserId(this.currentUser.id);
    for (const message of inboxMessages) {
      await dbService.deleteInboxMessage(message.id);
    }

    // Clear owned players
    const ownedPlayers = await dbService.getPlayersByOwner(this.currentUser.id);
    for (const player of ownedPlayers) {
      await dbService.updatePlayer(player.id, { ownerId: undefined });
    }

    // Delete user
    await dbService.delete('users', this.currentUser.id);

    // Clear session
    this.clearSession();
    this.notifyListeners();
    
    console.log('✅ Account deleted successfully');
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Admin access required');
    }
    return dbService.getAllUsers();
  }

  async makeUserAdmin(userId: string): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Admin access required');
    }
    await dbService.updateUser(userId, { isAdmin: true });
  }

  async removeUserAdmin(userId: string): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Admin access required');
    }
    await dbService.updateUser(userId, { isAdmin: false });
  }
}

// Export singleton instance
export const authService = new LocalAuthService();
export default authService;
