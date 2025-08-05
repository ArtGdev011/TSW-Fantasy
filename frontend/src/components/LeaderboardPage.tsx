import React, { useState, useEffect } from 'react';
import { teamService, TeamWithPlayers } from '../services/teamService';

const LeaderboardPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overall' | 'gameweek'>('overall');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const leaderboard = await teamService.getLeaderboard();
      setTeams(leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    if (viewMode === 'overall') {
      return b.points - a.points;
    } else {
      return b.gameweekPoints - a.gameweekPoints;
    }
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600';
      case 2: return 'text-gray-600';
      case 3: return 'text-orange-600';
      default: return 'text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">See how you rank against other managers</p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('overall')}
            className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
              viewMode === 'overall'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overall Points
          </button>
          <button
            onClick={() => setViewMode('gameweek')}
            className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
              viewMode === 'gameweek'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gameweek Points
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl mb-2">👑</div>
            <h3 className="text-lg font-semibold text-gray-900">League Leader</h3>
            <p className="text-gray-600">
              {sortedTeams.length > 0 ? sortedTeams[0].name : 'No teams yet'}
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {sortedTeams.length > 0 ? 
                (viewMode === 'overall' ? sortedTeams[0].points : sortedTeams[0].gameweekPoints) : 0
              } pts
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="text-lg font-semibold text-gray-900">Total Managers</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">{teams.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-900">Average Points</h3>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {teams.length > 0 ? Math.round(
                teams.reduce((sum, team) => 
                  sum + (viewMode === 'overall' ? team.points : team.gameweekPoints), 0
                ) / teams.length
              ) : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {viewMode === 'overall' ? 'Overall Rankings' : 'Gameweek Rankings'}
          </h2>
        </div>

        {teams.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-500">Be the first to create a team and top the leaderboard!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Captain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {viewMode === 'overall' ? 'Total Points' : 'GW Points'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedTeams.map((team, index) => {
                  const rank = index + 1;
                  const points = viewMode === 'overall' ? team.points : team.gameweekPoints;
                  
                  return (
                    <tr key={team.id} className={rank <= 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold ${getRankColor(rank)}`}>
                          {getRankIcon(rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-500">{team.formation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">{team.userId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{team.captainPlayer.name}</div>
                          <div className="text-gray-500">{team.captainPlayer.team}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-blue-600">{points}</span>
                        {viewMode === 'gameweek' && team.points > 0 && (
                          <div className="text-xs text-gray-500">Total: {team.points}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">£{(team.teamValue / 1000000).toFixed(1)}M</span>
                        <div className="text-xs text-gray-500">
                          Budget: £{(team.budget / 1000000).toFixed(1)}M
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Composition Summary */}
      {teams.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">League Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                £{((teams.reduce((sum, team) => sum + team.teamValue, 0) / teams.length) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600">Avg Team Value</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(teams.reduce((sum, team) => sum + team.points, 0) / teams.length)}
              </div>
              <div className="text-sm text-gray-600">Avg Total Points</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {teams.length > 0 ? Math.max(...teams.map(team => team.points)) : 0}
              </div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                £{((teams.reduce((sum, team) => sum + team.budget, 0) / teams.length) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600">Avg Budget Left</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
