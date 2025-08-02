import React, { useState, useEffect } from 'react';
import { Users, Star, DollarSign, TrendingUp, ShieldCheck, Target } from 'lucide-react';
import api from '../services/api';
import './Team.css';

interface Player {
  _id: string;
  name: string;
  position: string;
  club: string;
  price: number;
  totalPoints: number;
  form: number;
}

interface TeamData {
  _id: string;
  teamName: string;
  players: Player[];
  captain: string;
  viceCaptain: string;
  teamValue: number;
  bank: number;
  totalPoints: number;
  gameweekPoints: number;
  formation: string;
}

const Team: React.FC = () => {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teams/my-team');
      setTeam(response.data);
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptainChange = async (playerId: string) => {
    try {
      await api.put('/teams/captain', { captainId: playerId });
      setTeam(prev => prev ? { ...prev, captain: playerId } : null);
    } catch (error) {
      console.error('Failed to update captain:', error);
    }
  };

  const handleViceCaptainChange = async (playerId: string) => {
    try {
      await api.put('/teams/vice-captain', { viceCaptainId: playerId });
      setTeam(prev => prev ? { ...prev, viceCaptain: playerId } : null);
    } catch (error) {
      console.error('Failed to update vice captain:', error);
    }
  };

  const getPlayersByPosition = (position: string) => {
    return team?.players?.filter(player => player.position === position) || [];
  };

  const renderPlayerCard = (player: Player, isSubstitute: boolean = false) => {
    const isCaptain = team?.captain === player._id;
    const isViceCaptain = team?.viceCaptain === player._id;
    const isSelected = selectedPlayer === player._id;

    return (
      <div 
        key={player._id}
        className={`player-card ${isSubstitute ? 'substitute' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedPlayer(isSelected ? null : player._id)}
      >
        <div className="player-card-content">
          <div className="player-badges">
            {isCaptain && (
              <div className="badge captain-badge">
                <Star size={12} />
                <span>C</span>
              </div>
            )}
            {isViceCaptain && (
              <div className="badge vice-captain-badge">
                <ShieldCheck size={12} />
                <span>VC</span>
              </div>
            )}
          </div>
          
          <div className="player-shirt">
            <span className="position-abbr">{player.position}</span>
          </div>
          
          <div className="player-info">
            <h4>{player.name}</h4>
            <p>{player.club}</p>
            <div className="player-stats">
              <span className="points">{player.totalPoints} pts</span>
              <span className="price">£{player.price}m</span>
            </div>
          </div>
        </div>

        {isSelected && (
          <div className="player-actions">
            {!isCaptain && (
              <button 
                className="action-btn captain-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCaptainChange(player._id);
                }}
              >
                <Star size={14} />
                Make Captain
              </button>
            )}
            {!isViceCaptain && !isCaptain && (
              <button 
                className="action-btn vice-captain-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViceCaptainChange(player._id);
                }}
              >
                <ShieldCheck size={14} />
                Make Vice Captain
              </button>
            )}
            <button className="action-btn transfer-btn">
              <TrendingUp size={14} />
              Transfer Out
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="team-loading">
        <div className="loading-spinner"></div>
        <p>Loading your team...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="no-team">
        <Users size={64} />
        <h2>No Team Found</h2>
        <p>You haven't created a team yet. Go to the transfer market to build your squad!</p>
        <button className="btn-primary">Build Team</button>
      </div>
    );
  }

  const goalkeepers = getPlayersByPosition('GK');
  const midfielders = getPlayersByPosition('CDM');
  const leftWingers = getPlayersByPosition('LW');
  const rightWingers = getPlayersByPosition('RW');

  return (
    <div className="team">
      <div className="team-header">
        <div className="team-info">
          <h1>{team.teamName}</h1>
          <div className="team-stats">
            <div className="stat">
              <DollarSign size={16} />
              <span>Team Value: £{team.teamValue}m</span>
            </div>
            <div className="stat">
              <Target size={16} />
              <span>Total Points: {team.totalPoints}</span>
            </div>
            <div className="stat">
              <TrendingUp size={16} />
              <span>GW Points: {team.gameweekPoints}</span>
            </div>
            <div className="stat">
              <DollarSign size={16} />
              <span>Bank: £{team.bank}m</span>
            </div>
          </div>
        </div>
        
        <div className="team-actions">
          <button className="btn-secondary">Auto Pick</button>
          <button className="btn-primary">Make Transfers</button>
        </div>
      </div>

      <div className="pitch-container">
        <div className="pitch">
          <div className="formation-display">
            <h3>Formation: {team.formation || '4-4-2'}</h3>
          </div>

          {/* Starting XI */}
          <div className="starting-xi">
            {/* Goalkeepers */}
            <div className="position-line gk-line">
              <h4>Goalkeeper</h4>
              <div className="players-row">
                {goalkeepers.slice(0, 1).map(player => renderPlayerCard(player))}
              </div>
            </div>

            {/* Midfielders */}
            <div className="position-line mid-line">
              <h4>Midfielders</h4>
              <div className="players-row">
                {midfielders.slice(0, 5).map(player => renderPlayerCard(player))}
              </div>
            </div>

            {/* Wings */}
            <div className="position-line wing-line">
              <div className="wing-section">
                <h4>Left Wing</h4>
                <div className="players-row">
                  {leftWingers.slice(0, 3).map(player => renderPlayerCard(player))}
                </div>
              </div>
              
              <div className="wing-section">
                <h4>Right Wing</h4>
                <div className="players-row">
                  {rightWingers.slice(0, 3).map(player => renderPlayerCard(player))}
                </div>
              </div>
            </div>
          </div>

          {/* Substitutes */}
          <div className="substitutes">
            <h4>Substitutes</h4>
            <div className="subs-row">
              {goalkeepers.slice(1).map(player => renderPlayerCard(player, true))}
              {midfielders.slice(5).map(player => renderPlayerCard(player, true))}
              {leftWingers.slice(3).map(player => renderPlayerCard(player, true))}
              {rightWingers.slice(3).map(player => renderPlayerCard(player, true))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Summary */}
      <div className="team-summary">
        <div className="summary-card">
          <h3>Squad Summary</h3>
          <div className="position-breakdown">
            <div className="breakdown-item">
              <span>Goalkeepers:</span>
              <span>{goalkeepers.length}/2</span>
            </div>
            <div className="breakdown-item">
              <span>Midfielders:</span>
              <span>{midfielders.length}/8</span>
            </div>
            <div className="breakdown-item">
              <span>Left Wingers:</span>
              <span>{leftWingers.length}/5</span>
            </div>
            <div className="breakdown-item">
              <span>Right Wingers:</span>
              <span>{rightWingers.length}/5</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h3>Captain & Vice Captain</h3>
          <div className="captaincy-info">
            <div className="captain-info">
              <Star size={16} />
              <span>Captain: {team.players.find(p => p._id === team.captain)?.name || 'Not selected'}</span>
            </div>
            <div className="vice-captain-info">
              <ShieldCheck size={16} />
              <span>Vice Captain: {team.players.find(p => p._id === team.viceCaptain)?.name || 'Not selected'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
