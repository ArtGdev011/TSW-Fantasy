const express = require('express');
const Team = require('../models/Team');
const { authenticateSession, requireTeam } = require('../middleware/auth');
const { validateRequest, useChipSchema } = require('../middleware/validate');
const { checkGameLockMiddleware } = require('../utils/gameLock');

const router = express.Router();

/**
 * POST /api/chips/use
 * Use a chip for the current gameweek
 * 
 * Business Rules:
 * - Each chip can only be used once per season
 * - Only one chip can be active per gameweek
 * - Chips cannot be used during game lock periods
 * - Wildcard and Free Hit affect transfer rules
 * - Triple Captain and Bench Boost affect scoring
 */
router.post('/use', 
  authenticateSession, 
  requireTeam, 
  checkGameLockMiddleware,
  validateRequest(useChipSchema), 
  async (req, res) => {
  
  try {
    const { chipType } = req.body;
    const teamId = req.user.team;
    
    // Get team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }
    
    // Check if chip has already been used
    if (team.chips[chipType]) {
      return res.status(400).json({
        error: 'Chip already used',
        message: `${chipType} has already been used this season.`
      });
    }
    
    // Check if another chip is already active this gameweek
    if (team.activeChip && team.activeChip !== chipType) {
      return res.status(400).json({
        error: 'Chip already active',
        message: `${team.activeChip} is already active this gameweek.`
      });
    }
    
    // Validate chip usage based on type
    let validationResult = await validateChipUsage(team, chipType);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid chip usage',
        message: validationResult.message
      });
    }
    
    // Mark chip as used and active
    team.chips[chipType] = true;
    team.activeChip = chipType;
    
    // Apply chip effects
    await applyChipEffects(team, chipType);
    
    await team.save();
    
    console.log(`✅ Chip used: ${req.user.username} activated ${chipType}`);
    
    res.json({
      message: `${chipType} activated successfully`,
      chip: {
        type: chipType,
        effect: getChipDescription(chipType),
        activeUntil: getChipDuration(chipType)
      },
      team: {
        activeChip: team.activeChip,
        remainingChips: Object.keys(team.chips).filter(chip => !team.chips[chip])
      }
    });
    
  } catch (error) {
    console.error('❌ Chip usage error:', error);
    res.status(500).json({
      error: 'Failed to use chip',
      message: 'Unable to activate chip. Please try again.'
    });
  }
});

/**
 * GET /api/chips/available
 * Get available chips for the user's team
 */
router.get('/available', authenticateSession, requireTeam, async (req, res) => {
  try {
    const team = await Team.findById(req.user.team).select('chips activeChip');
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }
    
    const allChips = ['wildcard', 'tripleCaptain', 'benchBoost', 'freeHit'];
    
    const chipStatus = allChips.map(chipType => ({
      type: chipType,
      name: formatChipName(chipType),
      description: getChipDescription(chipType),
      used: team.chips[chipType],
      canUse: !team.chips[chipType] && (!team.activeChip || team.activeChip === chipType),
      isActive: team.activeChip === chipType
    }));
    
    res.json({
      chips: chipStatus,
      activeChip: team.activeChip,
      availableCount: chipStatus.filter(chip => !chip.used).length
    });
    
  } catch (error) {
    console.error('❌ Available chips error:', error);
    res.status(500).json({
      error: 'Failed to fetch available chips'
    });
  }
});

/**
 * GET /api/chips/history
 * Get chip usage history for the user's team
 */
router.get('/history', authenticateSession, requireTeam, async (req, res) => {
  try {
    const team = await Team.findById(req.user.team).select('chips');
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }
    
    const usedChips = Object.keys(team.chips)
      .filter(chip => team.chips[chip])
      .map(chipType => ({
        type: chipType,
        name: formatChipName(chipType),
        description: getChipDescription(chipType),
        usedAt: team.updatedAt // In a real app, you'd track when each chip was used
      }));
    
    res.json({
      usedChips,
      totalUsed: usedChips.length,
      remaining: 4 - usedChips.length
    });
    
  } catch (error) {
    console.error('❌ Chip history error:', error);
    res.status(500).json({
      error: 'Failed to fetch chip history'
    });
  }
});

/**
 * POST /api/chips/cancel
 * Cancel an active chip (only works for certain chips and conditions)
 */
router.post('/cancel', 
  authenticateSession, 
  requireTeam, 
  checkGameLockMiddleware,
  async (req, res) => {
  
  try {
    const team = await Team.findById(req.user.team);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }
    
    if (!team.activeChip) {
      return res.status(400).json({
        error: 'No active chip',
        message: 'No chip is currently active.'
      });
    }
    
    const activeChip = team.activeChip;
    
    // Check if chip can be cancelled
    if (!canCancelChip(activeChip)) {
      return res.status(400).json({
        error: 'Cannot cancel chip',
        message: `${activeChip} cannot be cancelled once activated.`
      });
    }
    
    // Revert chip effects
    await revertChipEffects(team, activeChip);
    
    // Mark chip as unused and inactive
    team.chips[activeChip] = false;
    team.activeChip = null;
    
    await team.save();
    
    console.log(`✅ Chip cancelled: ${req.user.username} cancelled ${activeChip}`);
    
    res.json({
      message: `${activeChip} cancelled successfully`,
      team: {
        activeChip: null,
        remainingChips: Object.keys(team.chips).filter(chip => !team.chips[chip])
      }
    });
    
  } catch (error) {
    console.error('❌ Chip cancellation error:', error);
    res.status(500).json({
      error: 'Failed to cancel chip',
      message: 'Unable to cancel chip. Please try again.'
    });
  }
});

// Helper Functions

/**
 * Validate if a chip can be used based on current team state
 */
async function validateChipUsage(team, chipType) {
  switch (chipType) {
    case 'wildcard':
      // Wildcard can always be used if not already used
      return { valid: true };
      
    case 'tripleCaptain':
      // Triple Captain requires a captain to be selected
      if (!team.captain) {
        return { 
          valid: false, 
          message: 'You must have a captain selected to use Triple Captain.' 
        };
      }
      return { valid: true };
      
    case 'benchBoost':
      // Bench Boost requires a full bench
      await team.populate('subs');
      if (team.subs.length !== 2) {
        return { 
          valid: false, 
          message: 'You must have a full bench (2 players) to use Bench Boost.' 
        };
      }
      return { valid: true };
      
    case 'freeHit':
      // Free Hit can always be used if not already used
      return { valid: true };
      
    default:
      return { 
        valid: false, 
        message: 'Invalid chip type.' 
      };
  }
}

/**
 * Apply chip effects to the team
 */
async function applyChipEffects(team, chipType) {
  switch (chipType) {
    case 'wildcard':
      // Reset transfer costs and give unlimited transfers for this gameweek
      team.transfers.free = 999; // Unlimited
      team.transfers.cost = 0;
      break;
      
    case 'freeHit':
      // Similar to wildcard but team reverts next gameweek
      team.transfers.free = 999; // Unlimited
      team.transfers.cost = 0;
      // Note: In a real implementation, you'd store the original team to revert
      break;
      
    case 'tripleCaptain':
    case 'benchBoost':
      // These chips affect scoring calculation, no immediate team changes needed
      break;
  }
}

/**
 * Revert chip effects (for cancellation)
 */
async function revertChipEffects(team, chipType) {
  switch (chipType) {
    case 'wildcard':
    case 'freeHit':
      // Reset transfers to normal state
      team.transfers.free = 1;
      team.transfers.cost = 0;
      break;
      
    case 'tripleCaptain':
    case 'benchBoost':
      // No immediate effects to revert
      break;
  }
}

/**
 * Check if a chip can be cancelled
 */
function canCancelChip(chipType) {
  // Only transfer-affecting chips can be cancelled before deadline
  return ['wildcard', 'freeHit'].includes(chipType);
}

/**
 * Get human-readable chip name
 */
function formatChipName(chipType) {
  const names = {
    wildcard: 'Wildcard',
    tripleCaptain: 'Triple Captain',
    benchBoost: 'Bench Boost',
    freeHit: 'Free Hit'
  };
  return names[chipType] || chipType;
}

/**
 * Get chip description
 */
function getChipDescription(chipType) {
  const descriptions = {
    wildcard: 'Make unlimited transfers for one gameweek with no point deductions.',
    tripleCaptain: 'Your captain scores triple points instead of double for one gameweek.',
    benchBoost: 'Points from your bench players are added to your total for one gameweek.',
    freeHit: 'Make unlimited transfers for one gameweek, but your team reverts afterwards.'
  };
  return descriptions[chipType] || 'Unknown chip effect.';
}

/**
 * Get chip duration information
 */
function getChipDuration(chipType) {
  const durations = {
    wildcard: 'Until next gameweek deadline',
    tripleCaptain: 'Current gameweek only',
    benchBoost: 'Current gameweek only',
    freeHit: 'Current gameweek only (team reverts next gameweek)'
  };
  return durations[chipType] || 'Unknown duration.';
}

module.exports = router;
