// Firebase Team Model for TSW Fantasy League
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
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "../config/firebase.js";

const COLLECTION_NAME = 'teams';

export class Team {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.userId = data.userId; // Firebase UID
    this.username = data.username; // For easier queries
    this.budget = data.budget || 300; // £300M starting budget
    this.totalPoints = data.totalPoints || 0;
    this.gameweekPoints = data.gameweekPoints || 0;
    this.rank = data.rank || 0;
    this.players = data.players || {
      gk: null,
      cdm1: null,
      cdm2: null,
      lw: null,
      rw: null
    };
    this.substitutes = data.substitutes || {
      sub1: null,
      sub2: null,
      sub3: null
    };
    this.captain = data.captain || null;
    this.viceCaptain = data.viceCaptain || null;
    this.formation = data.formation || '1-2-2';
    this.transfers = data.transfers || 0;
    this.chips = data.chips || {
      wildcard: true,
      benchBoost: true,
      tripleCaptain: true,
      freeHit: true
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create new team
  static async create(teamData) {
    try {
      // Validate required fields
      if (!teamData.name || !teamData.userId) {
        throw new Error('Team name and userId are required');
      }

      // Check if user already has a team
      const existingTeam = await Team.findByUserId(teamData.userId);
      if (existingTeam) {
        throw new Error('User already has a team');
      }

      const teamId = `team_${teamData.userId}`;
      
      const team = new Team({
        id: teamId,
        ...teamData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await setDoc(doc(db, COLLECTION_NAME, teamId), {
        name: team.name,
        userId: team.userId,
        username: team.username,
        budget: team.budget,
        totalPoints: team.totalPoints,
        gameweekPoints: team.gameweekPoints,
        rank: team.rank,
        players: team.players,
        substitutes: team.substitutes,
        captain: team.captain,
        viceCaptain: team.viceCaptain,
        formation: team.formation,
        transfers: team.transfers,
        chips: team.chips,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Team created successfully: ${team.name}`);
      return team;
    } catch (error) {
      console.error(`❌ Error creating team:`, error);
      throw new Error(`Error creating team: ${error.message}`);
    }
  }

  // Find team by user ID
  static async findByUserId(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where("userId", "==", userId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return new Team({
        id: doc.id,
        ...doc.data()
      });
    } catch (error) {
      console.error(`❌ Error finding team by userId:`, error);
      throw new Error(`Error finding team: ${error.message}`);
    }
  }

  // Find team by ID
  static async findById(teamId) {
    try {
      const teamDoc = await getDoc(doc(db, COLLECTION_NAME, teamId));
      
      if (!teamDoc.exists()) {
        return null;
      }

      return new Team({
        id: teamDoc.id,
        ...teamDoc.data()
      });
    } catch (error) {
      console.error(`❌ Error finding team:`, error);
      throw new Error(`Error finding team: ${error.message}`);
    }
  }

  // Get all teams
  static async findAll() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("totalPoints", "desc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => new Team({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`❌ Error getting all teams:`, error);
      throw new Error(`Error getting all teams: ${error.message}`);
    }
  }

  // Update team
  async update(updateData) {
    try {
      updateData.updatedAt = serverTimestamp();
      await updateDoc(doc(db, COLLECTION_NAME, this.id), updateData);
      
      // Update local instance
      Object.assign(this, updateData);
      console.log(`✅ Team updated: ${this.name}`);
    } catch (error) {
      console.error(`❌ Error updating team:`, error);
      throw new Error(`Error updating team: ${error.message}`);
    }
  }

  // Update team points
  async updatePoints(gameweekPoints) {
    try {
      this.gameweekPoints = gameweekPoints;
      this.totalPoints += gameweekPoints;
      this.updatedAt = new Date();

      await updateDoc(doc(db, COLLECTION_NAME, this.id), {
        gameweekPoints: this.gameweekPoints,
        totalPoints: this.totalPoints,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Team points updated: ${this.name} (+${gameweekPoints} pts)`);
    } catch (error) {
      console.error(`❌ Error updating team points:`, error);
      throw new Error(`Error updating team points: ${error.message}`);
    }
  }

  // Set captain and vice captain
  async setCaptain(captainId, viceCaptainId) {
    try {
      this.captain = captainId;
      this.viceCaptain = viceCaptainId;
      this.updatedAt = new Date();

      await updateDoc(doc(db, COLLECTION_NAME, this.id), {
        captain: this.captain,
        viceCaptain: this.viceCaptain,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Captain set for team: ${this.name}`);
    } catch (error) {
      console.error(`❌ Error setting captain:`, error);
      throw new Error(`Error setting captain: ${error.message}`);
    }
  }

  // Add player to team
  async addPlayer(position, playerId, cost) {
    try {
      if (this.budget < cost) {
        throw new Error('Insufficient budget');
      }

      this.players[position] = playerId;
      this.budget -= cost;
      this.updatedAt = new Date();

      await updateDoc(doc(db, COLLECTION_NAME, this.id), {
        players: this.players,
        budget: this.budget,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Player added to team: ${this.name}`);
    } catch (error) {
      console.error(`❌ Error adding player:`, error);
      throw new Error(`Error adding player: ${error.message}`);
    }
  }

  // Remove player from team
  async removePlayer(position, refund) {
    try {
      this.players[position] = null;
      this.budget += refund;
      this.updatedAt = new Date();

      await updateDoc(doc(db, COLLECTION_NAME, this.id), {
        players: this.players,
        budget: this.budget,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Player removed from team: ${this.name}`);
    } catch (error) {
      console.error(`❌ Error removing player:`, error);
      throw new Error(`Error removing player: ${error.message}`);
    }
  }

  // Use chip
  async useChip(chipType) {
    try {
      if (!this.chips[chipType]) {
        throw new Error(`${chipType} chip not available`);
      }

      this.chips[chipType] = false;
      this.updatedAt = new Date();

      await updateDoc(doc(db, COLLECTION_NAME, this.id), {
        chips: this.chips,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ ${chipType} chip used for team: ${this.name}`);
    } catch (error) {
      console.error(`❌ Error using chip:`, error);
      throw new Error(`Error using chip: ${error.message}`);
    }
  }

  // Delete team
  async delete() {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, this.id));
      console.log(`✅ Team deleted: ${this.name}`);
    } catch (error) {
      console.error(`❌ Error deleting team:`, error);
      throw new Error(`Error deleting team: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      username: this.username,
      budget: this.budget,
      totalPoints: this.totalPoints,
      gameweekPoints: this.gameweekPoints,
      rank: this.rank,
      players: this.players,
      substitutes: this.substitutes,
      captain: this.captain,
      viceCaptain: this.viceCaptain,
      formation: this.formation,
      transfers: this.transfers,
      chips: this.chips,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
