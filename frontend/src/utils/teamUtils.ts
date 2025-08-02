// Utility functions for team management and localStorage cleanup

/**
 * Clear all team-related data from localStorage
 * Call this when:
 * - User wants to create a new team
 * - User logs out
 * - User deletes their team
 */
export const clearTeamData = () => {
  const keysToRemove = [
    'tsw_user_team',
    'tsw_owned_players',
    'tsw_team_captain',
    'tsw_team_vice_captain',
    'tsw_team_formation'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 Team data cleared from localStorage');
};

/**
 * Clear user session data
 * Call this on logout
 */
export const clearUserSession = () => {
  const keysToRemove = [
    'authToken',
    'user',
    'tsw_user_team',
    'tsw_owned_players',
    'tsw_demo_users'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 User session cleared');
};

/**
 * Check if user has an existing team - MongoDB only
 * This function is deprecated - team existence should be checked via API
 */
export const hasExistingTeam = (): boolean => {
  console.warn('⚠️ hasExistingTeam() is deprecated - use teamAPI.get() instead');
  return false; // Always return false to force API calls
};

/**
 * Get current team data - MongoDB only
 * This function is deprecated - team data should be fetched via API
 */
export const getCurrentTeam = () => {
  console.warn('⚠️ getCurrentTeam() is deprecated - use teamAPI.get() instead');
  return null; // Always return null to force API calls  
};

/**
 * Reset player ownership for fresh team creation
 */
export const resetPlayerOwnership = () => {
  localStorage.removeItem('tsw_owned_players');
  console.log('🔄 Player ownership reset');
};

export default {
  clearTeamData,
  clearUserSession,
  hasExistingTeam,
  getCurrentTeam,
  resetPlayerOwnership
};
