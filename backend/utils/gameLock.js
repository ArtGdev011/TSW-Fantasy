/**
 * Game Lock Utility
 * Manages game lock periods to prevent changes before match kickoffs
 * In a real application, this would integrate with match schedules
 */

/**
 * Check if the game is currently locked
 * Game locks 60 minutes before the first match of any gameweek
 */
function isGameLocked() {
  // TODO: Implement real match schedule integration
  // For now, we'll simulate with a simple time-based lock
  
  // Example: Lock every Sunday from 11:00 AM to 6:00 PM (match day)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getHours();
  
  // Simulate lock on Sundays during match hours
  if (dayOfWeek === 0 && hour >= 11 && hour < 18) {
    return {
      locked: true,
      reason: 'Game locked during match day (Sunday 11:00 AM - 6:00 PM)',
      unlockTime: getNextUnlockTime()
    };
  }
  
  return {
    locked: false,
    reason: null,
    nextLockTime: getNextLockTime()
  };
}

/**
 * Get the next time the game will be locked
 */
function getNextLockTime() {
  const now = new Date();
  const nextSunday = new Date(now);
  
  // Calculate days until next Sunday
  const daysUntilSunday = (7 - now.getDay()) % 7;
  nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  nextSunday.setHours(11, 0, 0, 0); // 11:00 AM
  
  return nextSunday;
}

/**
 * Get the next time the game will be unlocked
 */
function getNextUnlockTime() {
  const now = new Date();
  const nextUnlock = new Date(now);
  
  if (now.getDay() === 0 && now.getHours() < 18) {
    // If it's Sunday and before 6 PM, unlock at 6 PM today
    nextUnlock.setHours(18, 0, 0, 0);
  } else {
    // Otherwise, unlock Monday at midnight
    const daysUntilMonday = (1 - now.getDay() + 7) % 7;
    nextUnlock.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextUnlock.setHours(0, 0, 0, 0);
  }
  
  return nextUnlock;
}

/**
 * Get current gameweek number
 * Simple implementation - in reality this would be based on league schedule
 */
function getCurrentGameweek() {
  // Calculate gameweek based on season start
  const seasonStart = new Date('2024-08-17'); // Example season start
  const now = new Date();
  const daysDiff = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24));
  const gameweek = Math.floor(daysDiff / 7) + 1;
  
  return Math.max(1, Math.min(38, gameweek)); // Clamp between 1-38
}

/**
 * Check if transfers are allowed
 * Transfers are blocked during game lock periods
 */
function areTransfersAllowed() {
  const lockStatus = isGameLocked();
  return !lockStatus.locked;
}

/**
 * Get time remaining until next deadline
 */
function getTimeUntilDeadline() {
  const lockStatus = isGameLocked();
  
  if (lockStatus.locked) {
    // Game is locked, return time until unlock
    const now = new Date();
    const unlockTime = lockStatus.unlockTime;
    const diffMs = unlockTime - now;
    
    return {
      type: 'unlock',
      milliseconds: diffMs,
      hours: Math.floor(diffMs / (1000 * 60 * 60)),
      minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
      message: `Game unlocks in ${Math.floor(diffMs / (1000 * 60 * 60))}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`
    };
  } else {
    // Game is open, return time until next lock
    const now = new Date();
    const lockTime = lockStatus.nextLockTime;
    const diffMs = lockTime - now;
    
    return {
      type: 'lock',
      milliseconds: diffMs,
      hours: Math.floor(diffMs / (1000 * 60 * 60)),
      minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
      message: `Deadline in ${Math.floor(diffMs / (1000 * 60 * 60))}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`
    };
  }
}

/**
 * Middleware to check game lock status
 */
function checkGameLockMiddleware(req, res, next) {
  const lockStatus = isGameLocked();
  
  if (lockStatus.locked) {
    return res.status(423).json({
      error: 'Game is locked',
      message: lockStatus.reason,
      unlockTime: lockStatus.unlockTime,
      timeUntilUnlock: getTimeUntilDeadline()
    });
  }
  
  // Add deadline info to response for client
  req.gameInfo = {
    gameweek: getCurrentGameweek(),
    timeUntilDeadline: getTimeUntilDeadline()
  };
  
  next();
}

module.exports = {
  isGameLocked,
  areTransfersAllowed,
  getCurrentGameweek,
  getTimeUntilDeadline,
  getNextLockTime,
  getNextUnlockTime,
  checkGameLockMiddleware
};
