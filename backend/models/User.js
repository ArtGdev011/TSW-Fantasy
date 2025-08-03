// Firebase User Model for TSW Fantasy League
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
  limit 
} from "firebase/firestore";
import { db } from "../config/firebase.js";
import bcrypt from 'bcrypt';

const COLLECTION_NAME = 'users';

export class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.createdAt = data.createdAt || new Date();
    this.lastLogin = data.lastLogin;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.role = data.role || 'user';
  }

  // Create new user
  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const userId = userData.username.toLowerCase();
      
      const user = new User({
        id: userId,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date(),
        isActive: true,
        role: 'user'
      });

      await setDoc(doc(db, COLLECTION_NAME, userId), {
        username: user.username,
        email: user.email,
        password: user.password,
        createdAt: user.createdAt,
        lastLogin: null,
        isActive: user.isActive,
        role: user.role
      });

      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const userDoc = await getDoc(doc(db, COLLECTION_NAME, username.toLowerCase()));
      
      if (!userDoc.exists()) {
        return null;
      }

      return new User({
        id: userDoc.id,
        ...userDoc.data()
      });
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
