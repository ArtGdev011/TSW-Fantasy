// Firebase Player Seeding Utility for TSW Fantasy League
import { Player } from '../models/PlayerFirebase.js';

// TSW Players Data
const tswPlayers = [
  // Goalkeepers (GK)
  { name: 'Sparta', position: 'GK', rating: 85, price: 12, team: 'TSW Elite' },
  { name: 'Bionic', position: 'GK', rating: 82, price: 10, team: 'TSW Pro' },
  { name: 'Julinko', position: 'GK', rating: 80, price: 9, team: 'TSW Champions' },
  { name: 'Sza', position: 'GK', rating: 78, price: 8, team: 'TSW Legends' },
  { name: 'GuiPro', position: 'GK', rating: 76, price: 7, team: 'TSW Warriors' },
  { name: 'Cajo', position: 'GK', rating: 75, price: 7, team: 'TSW Knights' },
  { name: 'Sese', position: 'GK', rating: 74, price: 6, team: 'TSW Guardians' },
  { name: 'Kirkz', position: 'GK', rating: 73, price: 6, team: 'TSW Titans' },
  { name: 'Owy', position: 'GK', rating: 72, price: 5, team: 'TSW Rangers' },
  { name: 'John', position: 'GK', rating: 70, price: 5, team: 'TSW United' },

  // Central Defensive Midfielders (CDM)
  { name: 'Swiss', position: 'CDM', rating: 88, price: 15, team: 'TSW Elite' },
  { name: 'Wonder', position: 'CDM', rating: 86, price: 13, team: 'TSW Pro' },
  { name: 'Pokers', position: 'CDM', rating: 84, price: 12, team: 'TSW Champions' },
  { name: 'Jazz', position: 'CDM', rating: 82, price: 11, team: 'TSW Legends' },
  { name: 'VoidTFK', position: 'CDM', rating: 80, price: 10, team: 'TSW Warriors' },
  { name: 'Luka', position: 'CDM', rating: 79, price: 9, team: 'TSW Knights' },
  { name: 'Pad', position: 'CDM', rating: 78, price: 9, team: 'TSW Guardians' },
  { name: 'Akashi', position: 'CDM', rating: 77, price: 8, team: 'TSW Titans' },
  { name: 'Zapepsi', position: 'CDM', rating: 76, price: 8, team: 'TSW Rangers' },
  { name: 'Lang', position: 'CDM', rating: 75, price: 7, team: 'TSW United' },

  // Left Wingers (LW)
  { name: 'Tico', position: 'LW', rating: 87, price: 14, team: 'TSW Elite' },
  { name: 'Zev', position: 'LW', rating: 84, price: 12, team: 'TSW Pro' },
  { name: 'Chips', position: 'LW', rating: 81, price: 10, team: 'TSW Champions' },
  { name: 'Mason', position: 'LW', rating: 79, price: 9, team: 'TSW Legends' },
  { name: 'Lavish', position: 'LW', rating: 77, price: 8, team: 'TSW Warriors' },

  // Right Wingers (RW)
  { name: 'Kzxl', position: 'RW', rating: 86, price: 13, team: 'TSW Elite' },
  { name: 'Oscar', position: 'RW', rating: 83, price: 11, team: 'TSW Pro' },
  { name: 'Coke', position: 'RW', rating: 80, price: 10, team: 'TSW Champions' },
  { name: 'Eang', position: 'RW', rating: 78, price: 9, team: 'TSW Legends' },
  { name: 'Google', position: 'RW', rating: 76, price: 8, team: 'TSW Warriors' }
];

/**
 * Seed players to Firebase Firestore
 * Creates all TSW players if they don't already exist
 */
export async function seedPlayersFirebase() {
  try {
    console.log('🌱 Starting Firebase player seeding process...');
    
    let created = 0;
    let existed = 0;

    for (const playerData of tswPlayers) {
      try {
        // Check if player already exists
        const existingPlayer = await Player.findById(playerData.name.toLowerCase().replace(/\s+/g, '-'));
        
        if (existingPlayer) {
          existed++;
          continue;
        }

        // Create new player
        await Player.create(playerData);
        console.log(`✅ Created player: ${playerData.name} (${playerData.position})`);
        created++;
        
      } catch (error) {
        console.error(`❌ Error creating player ${playerData.name}:`, error.message);
      }
    }

    // Get final count
    const allPlayers = await Player.findAll();
    const playersByPosition = allPlayers.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {});

    console.log('🎯 Firebase player seeding completed:');
    console.log(`   - Created: ${created} players`);
    console.log(`   - Already existed: ${existed} players`);
    console.log(`   - Total in database: ${allPlayers.length} players`);
    console.log('📊 Players by position:');
    Object.entries(playersByPosition).forEach(([position, count]) => {
      console.log(`   - ${position}: ${count} players`);
    });

    return {
      created,
      existed,
      total: allPlayers.length,
      byPosition: playersByPosition
    };

  } catch (error) {
    console.error('❌ Firebase player seeding failed:', error);
    throw error;
  }
}

export { tswPlayers };
