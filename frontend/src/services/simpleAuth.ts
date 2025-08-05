// Simple Local Authentication Service - No external dependencies
// Fresh rebuild for TSW Fantasy League

import { dbService, User } from './indexedDB';

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

// Simple password hashing using native Web Crypto API
class SimpleHash {
  static async hash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'tsw_salt_2025');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const newHash = await this.hash(password);
    return newHash === hash;
  }
}

class SimpleAuthService {
  private currentUser: AuthUser | null = null;
  private authToken: string | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    console.log('🔐 SimpleAuth initialized');
    this.initAuth();
  }

  private async initAuth() {
    try {
      // Check for existing session
      const savedToken = localStorage.getItem('tsw_auth_token');
      const savedUserId = localStorage.getItem('tsw_user_id');
      
      console.log('🔍 Checking saved session:', { savedToken: !!savedToken, savedUserId });
      
      if (savedToken && savedUserId) {
        const user = await dbService.getUserById(savedUserId);
        if (user && this.validateToken(savedToken, user)) {
          this.currentUser = this.mapUserToAuthUser(user);
          this.authToken = savedToken;
          console.log('✅ Session restored for user:', user.username);
          
          // Update last active
          await dbService.updateUser(user.id, { lastActive: new Date() });
          this.notifyListeners();
        } else {
          console.log('❌ Invalid session, clearing...');
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      this.clearSession();
    }
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      timestamp: Date.now(),
      random: Math.random(),
    };
    return btoa(JSON.stringify(payload));
  }

  private validateToken(token: string, user: User): boolean {
    try {
      const payload = JSON.parse(atob(token));
      const isValid = payload.userId === user.id && payload.username === user.username;
      console.log('🔍 Token validation:', { isValid, tokenUserId: payload.userId, userUserId: user.id });
      return isValid;
    } catch (error) {
      console.log('❌ Token validation failed:', error);
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
      preferences: user.preferences || { notifications: true, emailUpdates: true },
    };
  }

  private saveSession(user: User, token: string) {
    console.log('💾 Saving session for user:', user.username);
    localStorage.setItem('tsw_auth_token', token);
    localStorage.setItem('tsw_user_id', user.id);
    localStorage.setItem('tsw_username', user.username);
  }

  private clearSession() {
    console.log('🗑️ Clearing session');
    localStorage.removeItem('tsw_auth_token');
    localStorage.removeItem('tsw_user_id');
    localStorage.removeItem('tsw_username');
    this.currentUser = null;
    this.authToken = null;
  }

  private notifyListeners() {
    console.log('📢 Notifying listeners, current user:', this.currentUser?.username || 'none');
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
    console.log('🚀 Starting signup for:', data.username);
    
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

    if (!email.includes('@') || !email.includes('.')) {
      throw new Error('Please enter a valid email address');
    }

    try {
      // Check if username already exists
      console.log('🔍 Checking if username exists:', username);
      const existingUserByUsername = await dbService.getUserByUsername(username);
      if (existingUserByUsername) {
        throw new Error('Username already exists. Please choose a different username.');
      }

      // Check if email already exists
      console.log('🔍 Checking if email exists:', email);
      const existingUserByEmail = await dbService.getUserByEmail(email);
      if (existingUserByEmail) {
        throw new Error('Email already exists. Please use a different email.');
      }

      // Hash password
      console.log('🔐 Hashing password...');
      const hashedPassword = await SimpleHash.hash(password);

      // Create user
      console.log('👤 Creating user...');
      const userData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
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
      console.log('✅ User created:', user.username);
      
      // Generate token and save session
      const token = this.generateToken(user);
      this.saveSession(user, token);
      
      // Set current user
      this.currentUser = this.mapUserToAuthUser(user);
      this.authToken = token;
      
      // Notify listeners
      this.notifyListeners();
      
      console.log('🎉 Signup successful for:', username);
      return this.currentUser;
      
    } catch (error: any) {
      console.error('❌ Signup failed:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthUser> {
    console.log('🚀 Starting login for:', data.username);
    
    const { username, password } = data;

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    try {
      // Find user by username
      console.log('🔍 Finding user:', username);
      const user = await dbService.getUserByUsername(username.trim());
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Verify password
      console.log('🔐 Verifying password...');
      const isPasswordValid = await SimpleHash.verify(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid username or password');
      }

      // Update last active
      console.log('⏰ Updating last active...');
      await dbService.updateUser(user.id, { lastActive: new Date() });
      const updatedUser = await dbService.getUserById(user.id);
      
      if (!updatedUser) {
        throw new Error('Failed to update user');
      }
      
      // Generate token and save session
      const token = this.generateToken(updatedUser);
      this.saveSession(updatedUser, token);
      
      // Set current user
      this.currentUser = this.mapUserToAuthUser(updatedUser);
      this.authToken = token;
      
      // Notify listeners
      this.notifyListeners();
      
      console.log('🎉 Login successful for:', username);
      return this.currentUser;
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log('👋 Logging out user:', this.currentUser?.username);
    this.clearSession();
    this.notifyListeners();
    console.log('✅ Logout successful');
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    const isAuth = this.currentUser !== null && this.authToken !== null;
    console.log('🔍 Auth check:', { isAuth, hasUser: !!this.currentUser, hasToken: !!this.authToken });
    return isAuth;
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
}

// Export singleton instance
export const simpleAuth = new SimpleAuthService();
export default simpleAuth;
