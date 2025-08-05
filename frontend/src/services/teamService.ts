// Team Service using IndexedDB
// Replaces Firebase Team operations

import { dbService, Team, Player } from './indexedDB';
import { playerService } from './playerService';

export interface TeamCreationData {
  name: string;
  userId: string;
  players: string[]; // Array of player IDs (must be 11 players)
  captain: string; // Player ID
  viceCaptain: string; // Player ID
  formation: string; // e.g., "4-4-2", "3-5-2"
}

export interface TeamWithPlayers extends Team {
  playerDetails: Player[];
  captainPlayer: Player;
  viceCaptainPlayer: Player;
}

class TeamService {
  // Create a new team
  async createTeam(teamData: TeamCreationData): Promise<TeamWithPlayers> {
    try {
      const { name, userId, players, captain, viceCaptain, formation } = teamData;

      // Validation
      if (!name || !userId || !players || !captain || !viceCaptain || !formation) {
        throw new Error('All team fields are required');
      }

      if (players.length !== 11) {
        throw new Error('Team must have exactly 11 players');
      }

      if (!players.includes(captain)) {
        throw new Error('Captain must be one of the selected players');
      }

      if (!players.includes(viceCaptain)) {
        throw new Error('Vice-captain must be one of the selected players');
      }

      if (captain === viceCaptain) {
        throw new Error('Captain and vice-captain must be different players');
      }

      // Check if user already has a team
      const existingTeam = await dbService.getTeamByUserId(userId);
      if (existingTeam) {
        throw new Error('User already has a team. Delete existing team first.');
      }

      // Get player details and validate
      const playerDetails: Player[] = [];
      let totalCost = 0;
      const positionCounts = { GK: 0, DEF: 0, MID: 0, ATT: 0 };

      for (const playerId of players) {
        const player = await playerService.getPlayerById(playerId);
        if (!player) {
          throw new Error(`Player ${playerId} not found`);
        }

        if (player.ownerId && player.ownerId !== userId) {
          throw new Error(`Player ${player.name} is already owned by another user`);
        }

        playerDetails.push(player);
        totalCost += player.price;
        positionCounts[player.position]++;
      }

      // Validate formation constraints
      if (positionCounts.GK !== 1) {
        throw new Error('Team must have exactly 1 goalkeeper');
      }

      if (positionCounts.DEF < 3 || positionCounts.DEF > 5) {
        throw new Error('Team must have 3-5 defenders');
      }

      if (positionCounts.MID < 3 || positionCounts.MID > 5) {
        throw new Error('Team must have 3-5 midfielders');
      }

      if (positionCounts.ATT < 1 || positionCounts.ATT > 3) {
        throw new Error('Team must have 1-3 attackers');
      }

      // Get user and check budget
      const user = await dbService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (totalCost > user.budget) {
        throw new Error(`Team cost (£${totalCost.toLocaleString()}) exceeds budget (£${user.budget.toLocaleString()})`);
      }

      // Calculate team value and initial points
      const teamValue = totalCost;
      const teamPoints = playerDetails.reduce((sum, player) => sum + player.points, 0);

      // Create team
      const team = await dbService.createTeam({
        name,
        userId,
        players,
        captain,
        viceCaptain,
        formation,
        budget: user.budget - totalCost,
        teamValue,
        points: teamPoints,
        gameweekPoints: 0,
        rank: 0,
      });

      // Assign players to this user
      for (const playerId of players) {
        await playerService.setPlayerOwner(playerId, userId);
      }

      // Update user to mark as having a team
      await dbService.updateUser(userId, {
        hasTeam: true,
        teamId: team.id,
        budget: user.budget - totalCost,
      });

      // Get captain and vice-captain details
      const captainPlayer = playerDetails.find(p => p.id === captain)!;
      const viceCaptainPlayer = playerDetails.find(p => p.id === viceCaptain)!;

      console.log(`✅ Team "${name}" created for user ${userId}`);

      return {
        ...team,
        playerDetails,
        captainPlayer,
        viceCaptainPlayer,
      };
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  // Get team by ID
  async getTeamById(id: string): Promise<TeamWithPlayers | null> {
    try {
      const team = await dbService.getTeamById(id);
      if (!team) return null;

      return await this.populateTeamDetails(team);
    } catch (error) {
      console.error('Failed to get team:', error);
      throw new Error('Failed to load team');
    }
  }

  // Get team by user ID
  async getTeamByUserId(userId: string): Promise<TeamWithPlayers | null> {
    try {
      const team = await dbService.getTeamByUserId(userId);
      if (!team) return null;

      return await this.populateTeamDetails(team);
    } catch (error) {
      console.error('Failed to get user team:', error);
      throw new Error('Failed to load user team');
    }
  }

  // Get all teams
  async getAllTeams(): Promise<TeamWithPlayers[]> {
    try {
      const teams = await dbService.getAllTeams();
      const populatedTeams: TeamWithPlayers[] = [];

      for (const team of teams) {
        const populatedTeam = await this.populateTeamDetails(team);
        populatedTeams.push(populatedTeam);
      }

      return populatedTeams;
    } catch (error) {
      console.error('Failed to get all teams:', error);
      throw new Error('Failed to load teams');
    }
  }

  // Update team
  async updateTeam(id: string, updates: Partial<Team>): Promise<TeamWithPlayers> {
    try {
      const updatedTeam = await dbService.updateTeam(id, updates);
      return await this.populateTeamDetails(updatedTeam);
    } catch (error) {
      console.error('Failed to update team:', error);
      throw new Error('Failed to update team');
    }
  }

  // Delete team
  async deleteTeam(id: string): Promise<void> {
    try {
      const team = await dbService.getTeamById(id);
      if (!team) {
        throw new Error('Team not found');
      }

      // Release all players
      for (const playerId of team.players) {
        await playerService.removePlayerOwner(playerId);
      }

      // Update user
      await dbService.updateUser(team.userId, {
        hasTeam: false,
        teamId: undefined,
        budget: 300000000, // Reset to default budget
      });

      // Delete team
      await dbService.deleteTeam(id);

      console.log(`✅ Team ${team.name} deleted`);
    } catch (error) {
      console.error('Failed to delete team:', error);
      throw new Error('Failed to delete team');
    }
  }

  // Transfer players (simplified version)
  async transferPlayers(teamId: string, playersOut: string[], playersIn: string[]): Promise<TeamWithPlayers> {
    try {
      if (playersOut.length !== playersIn.length) {
        throw new Error('Number of players out must equal number of players in');
      }

      const team = await dbService.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Validate players out are owned by this team
      for (const playerId of playersOut) {
        if (!team.players.includes(playerId)) {
          throw new Error(`Player ${playerId} is not in this team`);
        }
      }

      // Validate players in are available
      for (const playerId of playersIn) {
        const player = await playerService.getPlayerById(playerId);
        if (!player) {
          throw new Error(`Player ${playerId} not found`);
        }
        if (player.ownerId && player.ownerId !== team.userId) {
          throw new Error(`Player ${player.name} is already owned`);
        }
      }

      // Calculate cost difference
      const playersOutDetails = await Promise.all(
        playersOut.map(id => playerService.getPlayerById(id))
      );
      const playersInDetails = await Promise.all(
        playersIn.map(id => playerService.getPlayerById(id))
      );

      const costOut = playersOutDetails.reduce((sum, player) => sum + (player?.price || 0), 0);
      const costIn = playersInDetails.reduce((sum, player) => sum + (player?.price || 0), 0);
      const costDifference = costIn - costOut;

      // Check budget
      if (costDifference > team.budget) {
        throw new Error('Insufficient budget for this transfer');
      }

      // Update team players
      const newPlayers = team.players.filter(id => !playersOut.includes(id)).concat(playersIn);

      // Validate team still has valid formation
      const playerDetails = await Promise.all(
        newPlayers.map(id => playerService.getPlayerById(id))
      );
      const positionCounts = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
      playerDetails.forEach(player => {
        if (player) positionCounts[player.position]++;
      });

      if (positionCounts.GK !== 1 || positionCounts.DEF < 3 || positionCounts.DEF > 5 ||
          positionCounts.MID < 3 || positionCounts.MID > 5 || positionCounts.ATT < 1 || positionCounts.ATT > 3) {
        throw new Error('Transfer would result in invalid team formation');
      }

      // Execute transfer
      for (const playerId of playersOut) {
        await playerService.removePlayerOwner(playerId);
      }
      for (const playerId of playersIn) {
        await playerService.setPlayerOwner(playerId, team.userId);
      }

      // Update team
      const updatedTeam = await dbService.updateTeam(teamId, {
        players: newPlayers,
        budget: team.budget - costDifference,
        teamValue: team.teamValue + costDifference,
      });

      console.log(`✅ Transfer completed for team ${team.name}`);
      return await this.populateTeamDetails(updatedTeam);
    } catch (error) {
      console.error('Failed to transfer players:', error);
      throw error;
    }
  }

  // Update captain and vice-captain
  async updateCaptains(teamId: string, captain: string, viceCaptain: string): Promise<TeamWithPlayers> {
    try {
      const team = await dbService.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      if (!team.players.includes(captain)) {
        throw new Error('Captain must be one of the team players');
      }

      if (!team.players.includes(viceCaptain)) {
        throw new Error('Vice-captain must be one of the team players');
      }

      if (captain === viceCaptain) {
        throw new Error('Captain and vice-captain must be different players');
      }

      const updatedTeam = await dbService.updateTeam(teamId, {
        captain,
        viceCaptain,
      });

      console.log(`✅ Captains updated for team ${team.name}`);
      return await this.populateTeamDetails(updatedTeam);
    } catch (error) {
      console.error('Failed to update captains:', error);
      throw error;
    }
  }

  // Get leaderboard
  async getLeaderboard(): Promise<TeamWithPlayers[]> {
    try {
      const teams = await this.getAllTeams();
      return teams.sort((a, b) => b.points - a.points);
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw new Error('Failed to load leaderboard');
    }
  }

  // Update team points (for gameweek scoring)
  async updateTeamPoints(teamId: string, gameweekPoints: number): Promise<TeamWithPlayers> {
    try {
      const team = await dbService.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const updatedTeam = await dbService.updateTeam(teamId, {
        gameweekPoints,
        points: team.points + gameweekPoints,
      });

      return await this.populateTeamDetails(updatedTeam);
    } catch (error) {
      console.error('Failed to update team points:', error);
      throw new Error('Failed to update team points');
    }
  }

  // Helper method to populate team with player details
  private async populateTeamDetails(team: Team): Promise<TeamWithPlayers> {
    const playerDetails = await Promise.all(
      team.players.map(async (playerId) => {
        const player = await playerService.getPlayerById(playerId);
        if (!player) {
          throw new Error(`Player ${playerId} not found`);
        }
        return player;
      })
    );

    const captainPlayer = playerDetails.find(p => p.id === team.captain);
    const viceCaptainPlayer = playerDetails.find(p => p.id === team.viceCaptain);

    if (!captainPlayer || !viceCaptainPlayer) {
      throw new Error('Captain or vice-captain not found in team players');
    }

    return {
      ...team,
      playerDetails,
      captainPlayer,
      viceCaptainPlayer,
    };
  }
}

// Export singleton instance
export const teamService = new TeamService();
export default teamService;
