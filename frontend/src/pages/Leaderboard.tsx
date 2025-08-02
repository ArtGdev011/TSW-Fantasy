import React, { useState, useEffect } from 'react';
import { Trophy, Search, Medal, Target, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Leaderboard.css';

interface LeaderboardEntry {
  _id: string;
  userId: {
    _id: string;
    username: string;
  };
  teamName: string;
  totalPoints: number;
  gameweekPoints: number;
  teamValue: number;
  rank: number;
  previousRank: number;
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    filterLeaderboard();
  }, [leaderboard, searchTerm]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teams/leaderboard');
      const data = response.data || [];
      
      // Add rank and previous rank to each entry
      const rankedData = data.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
        previousRank: index + 1 + Math.floor(Math.random() * 3) - 1 // Mock previous rank for demo
      }));
      
      setLeaderboard(rankedData);

      // Find current user's rank
      const userEntry = rankedData.find((entry: LeaderboardEntry) => 
        entry.userId.username === user?.username
      );
      if (userEntry) {
        setCurrentUserRank(userEntry);
      }

    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeaderboard = () => {
    if (!searchTerm) {
      setFilteredLeaderboard(leaderboard);
      return;
    }

    const filtered = leaderboard.filter(entry =>
      entry.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.teamName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeaderboard(filtered);
  };

  const getRankChange = (rank: number, previousRank: number) => {
    const change = previousRank - rank;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'rank-badge gold';
    if (rank === 2) return 'rank-badge silver';
    if (rank === 3) return 'rank-badge bronze';
    return 'rank-badge';
  };

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="header-content">
          <h1>
            <Trophy size={32} />
            Global Leaderboard
          </h1>
          <p>See how you stack up against other fantasy managers</p>
        </div>

        <div className="leaderboard-stats">
          <div className="stat-item">
            <Users size={20} />
            <span>{leaderboard.length} Managers</span>
          </div>
          <div className="stat-item">
            <Target size={20} />
            <span>Average: {Math.round(leaderboard.reduce((sum, entry) => sum + entry.totalPoints, 0) / leaderboard.length) || 0} pts</span>
          </div>
        </div>
      </div>

      {/* Current User Rank */}
      {currentUserRank && (
        <div className="current-user-rank">
          <div className="rank-card user-rank-card">
            <div className="rank-info">
              <div className={getRankBadgeClass(currentUserRank.rank)}>
                #{currentUserRank.rank}
              </div>
              <div className="manager-details">
                <h3>{currentUserRank.teamName}</h3>
                <p>{currentUserRank.userId.username} (You)</p>
              </div>
            </div>
            
            <div className="rank-stats">
              <div className="stat">
                <span className="label">Total Points</span>
                <span className="value">{currentUserRank.totalPoints}</span>
              </div>
              <div className="stat">
                <span className="label">GW Points</span>
                <span className="value">{currentUserRank.gameweekPoints}</span>
              </div>
              <div className="stat">
                <span className="label">Team Value</span>
                <span className="value">£{currentUserRank.teamValue}m</span>
              </div>
            </div>

            <div className="rank-change">
              {(() => {
                const change = getRankChange(currentUserRank.rank, currentUserRank.previousRank);
                return (
                  <div className={`change ${change.type}`}>
                    {change.type === 'up' && <TrendingUp size={16} />}
                    {change.type === 'down' && <TrendingUp size={16} className="flip" />}
                    {change.type === 'same' && <span>—</span>}
                    {change.value > 0 && <span>{change.value}</span>}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="leaderboard-search">
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search managers or team names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="podium">
          <div className="podium-place second">
            <div className="podium-user">
              <div className="rank-badge silver">
                <Medal size={20} />
              </div>
              <h3>{leaderboard[1].teamName}</h3>
              <p>{leaderboard[1].userId.username}</p>
              <span className="points">{leaderboard[1].totalPoints} pts</span>
            </div>
            <div className="podium-step">2</div>
          </div>

          <div className="podium-place first">
            <div className="podium-user">
              <div className="rank-badge gold">
                <Trophy size={24} />
              </div>
              <h3>{leaderboard[0].teamName}</h3>
              <p>{leaderboard[0].userId.username}</p>
              <span className="points">{leaderboard[0].totalPoints} pts</span>
            </div>
            <div className="podium-step">1</div>
          </div>

          <div className="podium-place third">
            <div className="podium-user">
              <div className="rank-badge bronze">
                <Medal size={20} />
              </div>
              <h3>{leaderboard[2].teamName}</h3>
              <p>{leaderboard[2].userId.username}</p>
              <span className="points">{leaderboard[2].totalPoints} pts</span>
            </div>
            <div className="podium-step">3</div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Manager</th>
              <th>Team Name</th>
              <th>Total Points</th>
              <th>GW Points</th>
              <th>Team Value</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboard.map((entry) => {
              const isCurrentUser = entry.userId.username === user?.username;
              const rankChange = getRankChange(entry.rank, entry.previousRank);
              
              return (
                <tr key={entry._id} className={isCurrentUser ? 'current-user' : ''}>
                  <td>
                    <div className={getRankBadgeClass(entry.rank)}>
                      {entry.rank <= 3 && entry.rank === 1 && <Trophy size={16} />}
                      {entry.rank <= 3 && entry.rank > 1 && <Medal size={16} />}
                      <span>#{entry.rank}</span>
                    </div>
                  </td>
                  <td className="manager-cell">
                    <div className="manager-info">
                      <span className="username">
                        {entry.userId.username}
                        {isCurrentUser && <span className="you-badge">You</span>}
                      </span>
                    </div>
                  </td>
                  <td className="team-name">{entry.teamName}</td>
                  <td className="points-cell">
                    <strong>{entry.totalPoints}</strong>
                  </td>
                  <td className="gw-points">{entry.gameweekPoints}</td>
                  <td className="team-value">£{entry.teamValue}m</td>
                  <td className="change-cell">
                    <div className={`change ${rankChange.type}`}>
                      {rankChange.type === 'up' && <TrendingUp size={14} />}
                      {rankChange.type === 'down' && <TrendingUp size={14} className="flip" />}
                      {rankChange.type === 'same' && <span>—</span>}
                      {rankChange.value > 0 && <span>{rankChange.value}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredLeaderboard.length === 0 && searchTerm && (
        <div className="no-results">
          <Search size={48} />
          <h3>No managers found</h3>
          <p>Try searching with a different term</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
