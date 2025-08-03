// Firebase Player Model for TSW Fantasy League
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
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase.js";

const COLLECTION_NAME = 'players';

export class Player {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.position = data.position;
    this.rating = data.rating || 75;
    this.price = data.price || 8;
    this.team = data.team || 'Free Agent';
    this.points = data.points || 0;
    this.gamesPlayed = data.gamesPlayed || 0;
    this.isAvailable = data.isAvailable !== undefined ? data.isAvailable : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create new player
  static async create(playerData) {
    try {
      // Validate required fields
      if (!playerData.name || !playerData.position) {
        throw new Error('Name and position are required fields');
      }
      
      const playerId = playerData.name.toLowerCase().replace(/\s+/g, '-');
      
      const player = new Player({
        id: playerId,
        ...playerData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Use serverTimestamp for consistency
      await setDoc(doc(db, COLLECTION_NAME, playerId), {
        name: player.name,
        position: player.position,
        rating: player.rating,
        price: player.price,
        team: player.team,
        points: player.points,
        gamesPlayed: player.gamesPlayed,
        isAvailable: player.isAvailable,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Player created successfully: ${player.name}`);
      return player;
    } catch (error) {
      console.error(`❌ Error creating player:`, error);
      throw new Error(`Error creating player: ${error.message}`);
    }
  }

  // Get all players
  static async findAll() {
    try {
      console.log('🔍 Fetching all players...');
      const q = query(collection(db, COLLECTION_NAME), orderBy("rating", "desc"));
      const querySnapshot = await getDocs(q);
      
      const players = querySnapshot.docs.map(doc => new Player({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Found ${players.length} players`);
      return players;
    } catch (error) {
      console.error(`❌ Error getting all players:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: Check Firestore rules or authentication');
      }
      throw new Error(`Error getting all players: ${error.message}`);
    }
  }

  // Get available players
  static async findAvailable() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where("isAvailable", "==", true),
        orderBy("rating", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => new Player({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error getting available players: ${error.message}`);
    }
  }

  // Get players by position
  static async findByPosition(position) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where("position", "==", position),
        where("isAvailable", "==", true),
        orderBy("rating", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => new Player({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error getting players by position: ${error.message}`);
    }
  }

  // Find player by ID
  static async findById(playerId) {
    try {
      const playerDoc = await getDoc(doc(db, COLLECTION_NAME, playerId));
      
      if (!playerDoc.exists()) {
        return null;
      }

      return new Player({
        id: playerDoc.id,
        ...playerDoc.data()
      });
    } catch (error) {
      throw new Error(`Error finding player: ${error.message}`);
    }
  }

  // Update player
  async update(updateData) {
    try {
      updateData.updatedAt = new Date();
      await updateDoc(doc(db, COLLECTION_NAME, this.id), updateData);
      
      // Update local instance
      Object.assign(this, updateData);
    } catch (error) {
      throw new Error(`Error updating player: ${error.message}`);
    }
  }

  // Update player points
  async updatePoints(points) {
    try {
      this.points += points;
      this.gamesPlayed += 1;
      this.updatedAt = new Date();

      await updateDoc(doc(db, COLLECTION_NAME, this.id), {
        points: this.points,
        gamesPlayed: this.gamesPlayed,
        updatedAt: this.updatedAt
      });
    } catch (error) {
      throw new Error(`Error updating player points: ${error.message}`);
    }
  }

  // Set availability
  async setAvailability(isAvailable) {
    try {
      this.isAvailable = isAvailable;
      this.updatedAt = new Date();

      await updateDoc(doc(db, COLLECTION_NAME, this.id), {
        isAvailable: this.isAvailable,
        updatedAt: this.updatedAt
      });
    } catch (error) {
      throw new Error(`Error updating player availability: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      rating: this.rating,
      price: this.price,
      team: this.team,
      points: this.points,
      gamesPlayed: this.gamesPlayed,
      isAvailable: this.isAvailable,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
