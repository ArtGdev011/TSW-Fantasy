// Player Service using IndexedDB
// Replaces Firebase Player operations

import { dbService, Player } from './indexedDB';

class PlayerService {
  // Get all players
  async getAllPlayers(): Promise<Player[]> {
    try {
      return await dbService.getAllPlayers();
    } catch (error) {
      console.error('Failed to get all players:', error);
      throw new Error('Failed to load players');
    }
  }

  // Get player by ID
  async getPlayerById(id: string): Promise<Player | null> {
    try {
      return await dbService.getPlayerById(id);
    } catch (error) {
      console.error('Failed to get player:', error);
      throw new Error('Failed to load player');
    }
  }

  // Get players by position
  async getPlayersByPosition(position: string): Promise<Player[]> {
    try {
      return await dbService.getPlayersByPosition(position);
    } catch (error) {
      console.error('Failed to get players by position:', error);
      throw new Error('Failed to load players');
    }
  }

  // Get players by team
  async getPlayersByTeam(team: string): Promise<Player[]> {
    try {
      return await dbService.getPlayersByTeam(team);
    } catch (error) {
      console.error('Failed to get players by team:', error);
      throw new Error('Failed to load players');
    }
  }

  // Get available players (not owned by anyone)
  async getAvailablePlayers(): Promise<Player[]> {
    try {
      const allPlayers = await dbService.getAllPlayers();
      return allPlayers.filter(player => player.isAvailable && !player.ownerId);
    } catch (error) {
      console.error('Failed to get available players:', error);
      throw new Error('Failed to load available players');
    }
  }

  // Get players owned by a user
  async getPlayersByOwner(ownerId: string): Promise<Player[]> {
    try {
      return await dbService.getPlayersByOwner(ownerId);
    } catch (error) {
      console.error('Failed to get owned players:', error);
      throw new Error('Failed to load owned players');
    }
  }

  // Create a new player (admin only)
  async createPlayer(playerData: {
    name: string;
    position: 'GK' | 'DEF' | 'MID' | 'ATT';
    rating: number;
    price: number;
    team: string;
    points?: number;
    gameweekPoints?: number;
    gamesPlayed?: number;
    isAvailable?: boolean;
  }): Promise<Player> {
    try {
      const player = await dbService.createPlayer({
        ...playerData,
        points: playerData.points || 0,
        gameweekPoints: playerData.gameweekPoints || 0,
        gamesPlayed: playerData.gamesPlayed || 0,
        isAvailable: playerData.isAvailable !== false,
      });
      
      console.log(`✅ Player ${player.name} created`);
      return player;
    } catch (error) {
      console.error('Failed to create player:', error);
      throw new Error('Failed to create player');
    }
  }

  // Update player
  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    try {
      const player = await dbService.updatePlayer(id, updates);
      console.log(`✅ Player ${player.name} updated`);
      return player;
    } catch (error) {
      console.error('Failed to update player:', error);
      throw new Error('Failed to update player');
    }
  }

  // Set player owner (for team creation/transfers)
  async setPlayerOwner(playerId: string, ownerId: string): Promise<Player> {
    try {
      return await this.updatePlayer(playerId, { ownerId });
    } catch (error) {
      console.error('Failed to set player owner:', error);
      throw new Error('Failed to assign player');
    }
  }

  // Remove player owner (for transfers/releases)
  async removePlayerOwner(playerId: string): Promise<Player> {
    try {
      return await this.updatePlayer(playerId, { ownerId: undefined });
    } catch (error) {
      console.error('Failed to remove player owner:', error);
      throw new Error('Failed to release player');
    }
  }

  // Update player points
  async updatePlayerPoints(playerId: string, gameweekPoints: number): Promise<Player> {
    try {
      const player = await dbService.getPlayerById(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      const totalPoints = player.points + gameweekPoints;
      return await this.updatePlayer(playerId, {
        gameweekPoints,
        points: totalPoints,
        gamesPlayed: player.gamesPlayed + 1,
      });
    } catch (error) {
      console.error('Failed to update player points:', error);
      throw new Error('Failed to update player points');
    }
  }

  // Search players
  async searchPlayers(query: string): Promise<Player[]> {
    try {
      const allPlayers = await dbService.getAllPlayers();
      const searchQuery = query.toLowerCase();
      
      return allPlayers.filter(player => 
        player.name.toLowerCase().includes(searchQuery) ||
        player.team.toLowerCase().includes(searchQuery) ||
        player.position.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      console.error('Failed to search players:', error);
      throw new Error('Failed to search players');
    }
  }

  // Get top players by points
  async getTopPlayers(limit: number = 10): Promise<Player[]> {
    try {
      const allPlayers = await dbService.getAllPlayers();
      return allPlayers
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top players:', error);
      throw new Error('Failed to load top players');
    }
  }

  // Get players by price range
  async getPlayersByPriceRange(minPrice: number, maxPrice: number): Promise<Player[]> {
    try {
      const allPlayers = await dbService.getAllPlayers();
      return allPlayers.filter(player => 
        player.price >= minPrice && player.price <= maxPrice
      );
    } catch (error) {
      console.error('Failed to get players by price range:', error);
      throw new Error('Failed to load players');
    }
  }

  // Get players by rating range
  async getPlayersByRatingRange(minRating: number, maxRating: number): Promise<Player[]> {
    try {
      const allPlayers = await dbService.getAllPlayers();
      return allPlayers.filter(player => 
        player.rating >= minRating && player.rating <= maxRating
      );
    } catch (error) {
      console.error('Failed to get players by rating range:', error);
      throw new Error('Failed to load players');
    }
  }

  // Initialize default players (for first-time setup)
  async initializeDefaultPlayers(): Promise<void> {
    try {
      const existingPlayers = await dbService.getAllPlayers();
      if (existingPlayers.length > 0) {
        console.log('Players already exist, skipping initialization');
        return;
      }

      const defaultPlayers = [
        // Goalkeepers
        { name: 'Alisson Becker', position: 'GK' as const, rating: 88, price: 55000000, team: 'Liverpool' },
        { name: 'Ederson', position: 'GK' as const, rating: 87, price: 50000000, team: 'Manchester City' },
        { name: 'Hugo Lloris', position: 'GK' as const, rating: 85, price: 40000000, team: 'Tottenham' },
        
        // Defenders
        { name: 'Virgil van Dijk', position: 'DEF' as const, rating: 90, price: 75000000, team: 'Liverpool' },
        { name: 'Ruben Dias', position: 'DEF' as const, rating: 88, price: 65000000, team: 'Manchester City' },
        { name: 'Thiago Silva', position: 'DEF' as const, rating: 86, price: 35000000, team: 'Chelsea' },
        { name: 'Raphael Varane', position: 'DEF' as const, rating: 85, price: 55000000, team: 'Manchester United' },
        
        // Midfielders
        { name: 'Kevin De Bruyne', position: 'MID' as const, rating: 91, price: 100000000, team: 'Manchester City' },
        { name: 'Bruno Fernandes', position: 'MID' as const, rating: 87, price: 85000000, team: 'Manchester United' },
        { name: 'N\'Golo Kante', position: 'MID' as const, rating: 87, price: 70000000, team: 'Chelsea' },
        { name: 'Jordan Henderson', position: 'MID' as const, rating: 84, price: 45000000, team: 'Liverpool' },
        
        // Attackers
        { name: 'Mohamed Salah', position: 'ATT' as const, rating: 90, price: 110000000, team: 'Liverpool' },
        { name: 'Harry Kane', position: 'ATT' as const, rating: 89, price: 120000000, team: 'Tottenham' },
        { name: 'Raheem Sterling', position: 'ATT' as const, rating: 86, price: 80000000, team: 'Manchester City' },
        { name: 'Marcus Rashford', position: 'ATT' as const, rating: 85, price: 85000000, team: 'Manchester United' },
      ];

      for (const playerData of defaultPlayers) {
        await this.createPlayer({
          ...playerData,
          points: Math.floor(Math.random() * 50),
          gameweekPoints: Math.floor(Math.random() * 10),
          gamesPlayed: Math.floor(Math.random() * 20),
          isAvailable: true,
        });
      }

      console.log('✅ Default players initialized');
    } catch (error) {
      console.error('Failed to initialize default players:', error);
      throw new Error('Failed to initialize default players');
    }
  }

  // Delete player (admin only)
  async deletePlayer(id: string): Promise<void> {
    try {
      await dbService.delete('players', id);
      console.log(`✅ Player deleted`);
    } catch (error) {
      console.error('Failed to delete player:', error);
      throw new Error('Failed to delete player');
    }
  }

  // Bulk update players
  async bulkUpdatePlayers(updates: { id: string; updates: Partial<Player> }[]): Promise<void> {
    try {
      for (const { id, updates: playerUpdates } of updates) {
        await this.updatePlayer(id, playerUpdates);
      }
      console.log(`✅ Bulk updated ${updates.length} players`);
    } catch (error) {
      console.error('Failed to bulk update players:', error);
      throw new Error('Failed to bulk update players');
    }
  }
}

// Export singleton instance
export const playerService = new PlayerService();
export default playerService;
