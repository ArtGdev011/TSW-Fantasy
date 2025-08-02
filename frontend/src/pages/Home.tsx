import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { publicAPI } from '../services/api';
import { Trophy, Users, Target, Zap, TrendingUp } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gameInfoData, leaderboardData] = await Promise.all([
          publicAPI.getGameInfo(),
          publicAPI.getLeaderboard()
        ]);
        
        setGameInfo(gameInfoData);
        setLeaderboard(leaderboardData.teams || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="highlight">TSW Fantasy League</span>
          </h1>
          <p className="hero-subtitle">
            Build your dream team, compete with friends, and prove you're the ultimate fantasy manager!
          </p>
          
          <div className="hero-stats">
            <div className="stat">
              <Trophy className="stat-icon" />
              <div>
                <div className="stat-number">57</div>
                <div className="stat-label">Players Available</div>
              </div>
            </div>
            <div className="stat">
              <Target className="stat-icon" />
              <div>
                <div className="stat-number">GW {gameInfo?.gameweek || 38}</div>
                <div className="stat-label">Current Gameweek</div>
              </div>
            </div>
            <div className="stat">
              <Users className="stat-icon" />
              <div>
                <div className="stat-number">{leaderboard.length}</div>
                <div className="stat-label">Active Managers</div>
              </div>
            </div>
          </div>

          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="cta-button primary">
                <Trophy size={20} />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="cta-button primary">
                  <Zap size={20} />
                  Start Playing
                </Link>
                <Link to="/login" className="cta-button secondary">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Game Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Users />
              </div>
              <h3>Team Management</h3>
              <p>Build your squad with 5 starters and 2 substitutes across 4 positions: GK, CDM, LW, and RW.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Target />
              </div>
              <h3>Strategic Transfers</h3>
              <p>1 free transfer per gameweek. Additional transfers cost 4 points each. Plan wisely!</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Zap />
              </div>
              <h3>Power Chips</h3>
              <p>Use strategic chips like Wildcard, Triple Captain, Bench Boost, and Free Hit once per season.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Trophy />
              </div>
              <h3>Live Scoring</h3>
              <p>Points for goals, assists, saves, and clean sheets. Captain gets double points!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      {leaderboard.length > 0 && (
        <section className="leaderboard-preview">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Top Managers</h2>
              <Link to="/leaderboard" className="view-all-link">
                <TrendingUp size={18} />
                View Full Leaderboard
              </Link>
            </div>
            
            <div className="leaderboard-cards">
              {leaderboard.slice(0, 3).map((team, index) => (
                <div key={team._id} className={`leaderboard-card position-${index + 1}`}>
                  <div className="position-badge">{index + 1}</div>
                  <div className="team-info">
                    <h3 className="team-name">{team.name}</h3>
                    <p className="manager-name">{team.user?.username || 'Unknown'}</p>
                  </div>
                  <div className="points">
                    <span className="total-points">{team.totalPoints}</span>
                    <span className="points-label">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Game Rules */}
      <section className="game-rules">
        <div className="container">
          <h2 className="section-title">How to Play</h2>
          <div className="rules-grid">
            <div className="rule">
              <div className="rule-number">1</div>
              <div className="rule-content">
                <h3>Build Your Squad</h3>
                <p>Select 5 starters (1 GK, 2 CDM, 1 LW, 1 RW) and 2 substitutes within your €150M budget.</p>
              </div>
            </div>
            
            <div className="rule">
              <div className="rule-number">2</div>
              <div className="rule-content">
                <h3>Choose Your Captain</h3>
                <p>Pick a captain (2x points) and vice-captain. If both play, each gets 1.5x points.</p>
              </div>
            </div>
            
            <div className="rule">
              <div className="rule-number">3</div>
              <div className="rule-content">
                <h3>Make Transfers</h3>
                <p>1 free transfer per gameweek. Extra transfers cost 4 points each.</p>
              </div>
            </div>
            
            <div className="rule">
              <div className="rule-number">4</div>
              <div className="rule-content">
                <h3>Use Chips Wisely</h3>
                <p>Strategic one-time chips can boost your score: Wildcard, Triple Captain, Bench Boost, Free Hit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!user && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Start Your Fantasy Journey?</h2>
              <p>Join thousands of managers competing for fantasy glory!</p>
              <Link to="/register" className="cta-button large">
                <Trophy size={24} />
                Create Account
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
