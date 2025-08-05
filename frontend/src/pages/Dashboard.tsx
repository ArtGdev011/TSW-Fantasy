import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContextLocal';
import api from '../services/api';
import { Calendar, Users, Trophy, TrendingUp, Clock, Star } from 'lucide-react';
import './Dashboard.css';

interface DashboardStats {
  currentGameweek: number;
  totalPlayers: number;
  activeManagers: number;
  averageScore: number;
}

interface RecentActivity {
  id: string;
  type: 'transfer' | 'captain' | 'chip';
  description: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources in parallel
      const [statsResponse, teamResponse, leaderboardResponse] = await Promise.all([
        api.get('/gameweeks/current'),
        api.get('/teams/my-team'),
        api.get('/teams/leaderboard?limit=5')
      ]);

      // Set stats (mock some data for now)
      setStats({
        currentGameweek: statsResponse.data?.gameweek || 1,
        totalPlayers: 57,
        activeManagers: leaderboardResponse.data?.length || 0,
        averageScore: 45
      });

      setTeam(teamResponse.data);
      setLeaderboard(leaderboardResponse.data || []);

      // Mock recent activity for now
      setRecentActivity([
        {
          id: '1',
          type: 'transfer',
          description: 'Transferred in Salah for Sterling',
          timestamp: '2 hours ago'
        },
        {
          id: '2',
          type: 'captain',
          description: 'Made Haaland captain',
          timestamp: '1 day ago'
        },
        {
          id: '3',
          type: 'chip',
          description: 'Used Triple Captain chip',
          timestamp: '3 days ago'
        }
      ]);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}!</h1>
        <p>Here's your fantasy football overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Gameweek {stats?.currentGameweek}</h3>
            <p>Current Round</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats?.totalPlayers}</h3>
            <p>Total Players</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Trophy size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats?.activeManagers}</h3>
            <p>Active Managers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats?.averageScore}</h3>
            <p>Average Score</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Team Overview */}
        <div className="dashboard-card team-overview">
          <div className="card-header">
            <h2>Your Team</h2>
            {team && (
              <div className="team-stats">
                <span>Value: £{team.teamValue || 100}m</span>
                <span>Bank: £{team.bank || 0}m</span>
              </div>
            )}
          </div>
          
          {team ? (
            <div className="team-preview">
              <div className="formation-preview">
                <div className="position-group">
                  <h4>Goalkeepers ({team.players?.filter((p: any) => p.position === 'GK').length || 0})</h4>
                  {team.players?.filter((p: any) => p.position === 'GK').slice(0, 2).map((player: any) => (
                    <div key={player._id} className="player-item">
                      <span>{player.name}</span>
                      <span className="player-price">£{player.price}m</span>
                    </div>
                  ))}
                </div>
                
                <div className="position-group">
                  <h4>Midfielders ({team.players?.filter((p: any) => p.position === 'CDM').length || 0})</h4>
                  {team.players?.filter((p: any) => p.position === 'CDM').slice(0, 3).map((player: any) => (
                    <div key={player._id} className="player-item">
                      <span>{player.name}</span>
                      <span className="player-price">£{player.price}m</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="team-actions">
                <button className="btn-primary">View Full Team</button>
                <button className="btn-secondary">Make Transfers</button>
              </div>
            </div>
          ) : (
            <div className="no-team">
              <p>You haven't created a team yet!</p>
              <button className="btn-primary">Create Team</button>
            </div>
          )}
        </div>

        {/* Mini Leaderboard */}
        <div className="dashboard-card mini-leaderboard">
          <div className="card-header">
            <h2>Top Managers</h2>
            <button className="view-all-btn">View All</button>
          </div>
          
          <div className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <div key={entry._id} className="leaderboard-item">
                <div className="rank">
                  {index + 1}
                  {index === 0 && <Star size={16} className="crown" />}
                </div>
                <div className="manager-info">
                  <span className="name">{entry.userId?.username || 'Unknown'}</span>
                  <span className="team-name">{entry.teamName}</span>
                </div>
                <div className="points">{entry.totalPoints}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card recent-activity">
          <div className="card-header">
            <h2>Recent Activity</h2>
          </div>
          
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'transfer' && <TrendingUp size={16} />}
                  {activity.type === 'captain' && <Star size={16} />}
                  {activity.type === 'chip' && <Trophy size={16} />}
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <span className="activity-time">
                    <Clock size={12} />
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card quick-actions">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          
          <div className="actions-grid">
            <button className="action-btn">
              <Users size={20} />
              <span>View Team</span>
            </button>
            <button className="action-btn">
              <TrendingUp size={20} />
              <span>Transfers</span>
            </button>
            <button className="action-btn">
              <Trophy size={20} />
              <span>Leaderboard</span>
            </button>
            <button className="action-btn">
              <Calendar size={20} />
              <span>Fixtures</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
