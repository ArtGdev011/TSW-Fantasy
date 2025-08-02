import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI, playersAPI, Team, Player as APIPlayer } from '../services/api';
import PlayerCard, { Player as CardPlayer } from './PlayerCard';
import BudgetBar from './BudgetBar';
import toast from 'react-hot-toast';
import { 
  Trophy, 
  Users, 
  Target, 
  Edit3, 
  BarChart3, 
  Calendar,
  TrendingUp,
  Award,
  Star,
  Crown
} from 'lucide-react';

// Helper function to convert APIPlayer to CardPlayer
const convertPlayerForCard = (player: APIPlayer): CardPlayer => ({
  id: player._id,
  name: player.name,
  position: player.position,
  region: player.region,
  club: player.region, // Using region as club for now
  overall: player.overall,
  price: player.price,
  form: 75, // Default form value
  selected: 0, // Default selected value
});

const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<APIPlayer[]>([]);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const teamResponse = await teamAPI.get();
      
      if (teamResponse.team) {
        setTeam(teamResponse.team);
        
        // Players are already included in the team object
        const allPlayers = [
          teamResponse.team.players.gk,
          teamResponse.team.players.cdm1,
          teamResponse.team.players.cdm2,
          teamResponse.team.players.lw,
          teamResponse.team.players.rw,
        ];
        
        // Add substitutes if they exist
        if (teamResponse.team.substitutes) {
          allPlayers.push(
            teamResponse.team.substitutes.sub1,
            teamResponse.team.substitutes.sub2,
            teamResponse.team.substitutes.sub3
          );
        }
        
        setPlayers(allPlayers);
      } else {
        // No team exists, redirect to create team
        navigate('/create-team');
      }
    } catch (error) {
      console.error('Error loading team:', error);
      toast.error('Failed to load team');
      navigate('/create-team');
    } finally {
      setLoading(false);
    }
  };

  const getCaptainPlayer = (): APIPlayer | undefined => {
    return team?.captain;
  };

  const getViceCaptainPlayer = (): APIPlayer | undefined => {
    return team?.viceCaptain;
  };

  const totalTeamValue = players.reduce((sum, player) => sum + player.price, 0);
  const averageRating = players.length > 0 
    ? Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tsw-blue/30 border-t-tsw-blue rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Your Team</h2>
          <p className="text-gray-400">Preparing your fantasy squad...</p>
        </div>
      </div>
    );
  }

  if (!team || players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Team Found</h2>
          <p className="text-gray-400 mb-6">You haven't created a team yet.</p>
          <button
            onClick={() => navigate('/create-team')}
            className="bg-gradient-to-r from-tsw-blue to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-tsw-blue/90 hover:to-blue-600/90 transition-all duration-200 transform hover:scale-105"
          >
            Create Your Team
          </button>
        </div>
      </div>
    );
  }

  const captainPlayer = getCaptainPlayer();
  const viceCaptainPlayer = getViceCaptainPlayer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-tsw-blue to-tsw-red bg-clip-text text-transparent mb-4">
            {team.name}
          </h1>
          <p className="text-gray-400 text-lg">Your TSW Fantasy Team</p>
        </div>

        {/* Team Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{team.totalPoints || 0}</div>
            <div className="text-gray-400 text-sm">Total Points</div>
          </div>
          
          <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 text-center">
            <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{averageRating}</div>
            <div className="text-gray-400 text-sm">Avg Rating</div>
          </div>
          
          <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{totalTeamValue}M</div>
            <div className="text-gray-400 text-sm">Team Value</div>
          </div>
          
          <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">N/A</div>
            <div className="text-gray-400 text-sm">Global Rank</div>
          </div>
        </div>

        {/* Captain & Vice-Captain Section */}
        <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Team Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {captainPlayer && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-yellow-400">Captain</h3>
                </div>
                <PlayerCard
                  player={convertPlayerForCard(captainPlayer)}
                  isSelected={true}
                  onSelect={() => {}}
                  showPrice={false}
                  captain="C"
                />
                <p className="text-gray-400 text-sm mt-2">Double Points</p>
              </div>
            )}
            
            {viceCaptainPlayer && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Star className="w-6 h-6 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-300">Vice-Captain</h3>
                </div>
                <PlayerCard
                  player={convertPlayerForCard(viceCaptainPlayer)}
                  isSelected={true}
                  onSelect={() => {}}
                  showPrice={false}
                  captain="VC"
                />
                <p className="text-gray-400 text-sm mt-2">1.5x Points</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Formation */}
        <div className="bg-tsw-dark rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Team Formation</h2>
          
          <div className="relative">
            {/* Football Field Background */}
            <div className="bg-green-900/20 rounded-2xl p-8 border border-green-500/20">
              <div className="grid grid-cols-5 gap-6 items-center min-h-[400px]">
                {/* Goalkeeper */}
                <div className="col-span-5 flex justify-center">
                  <div className="text-center">
                    <PlayerCard
                      player={convertPlayerForCard(team.players.gk)}
                      isSelected={true}
                      onSelect={() => {}}
                      showPrice={false}
                      captain={
                        team.captain._id === team.players.gk._id ? 'C' :
                        team.viceCaptain._id === team.players.gk._id ? 'VC' : undefined
                      }
                    />
                  </div>
                </div>
                
                {/* CDMs */}
                <div className="col-span-2 flex justify-center">
                  <PlayerCard
                    player={convertPlayerForCard(team.players.cdm1)}
                    isSelected={true}
                    onSelect={() => {}}
                    showPrice={false}
                    captain={
                      team.captain._id === team.players.cdm1._id ? 'C' :
                      team.viceCaptain._id === team.players.cdm1._id ? 'VC' : undefined
                    }
                  />
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-2 flex justify-center">
                  <PlayerCard
                    player={convertPlayerForCard(team.players.cdm2)}
                    isSelected={true}
                    onSelect={() => {}}
                    showPrice={false}
                    captain={
                      team.captain._id === team.players.cdm2._id ? 'C' :
                      team.viceCaptain._id === team.players.cdm2._id ? 'VC' : undefined
                    }
                  />
                </div>
                
                {/* Wingers */}
                <div className="col-span-2 flex justify-center">
                  <PlayerCard
                    player={convertPlayerForCard(team.players.lw)}
                    isSelected={true}
                    onSelect={() => {}}
                    showPrice={false}
                    captain={
                      team.captain._id === team.players.lw._id ? 'C' :
                      team.viceCaptain._id === team.players.lw._id ? 'VC' : undefined
                    }
                  />
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-2 flex justify-center">
                  <PlayerCard
                    player={convertPlayerForCard(team.players.rw)}
                    isSelected={true}
                    onSelect={() => {}}
                    showPrice={false}
                    captain={
                      team.captain._id === team.players.rw._id ? 'C' :
                      team.viceCaptain._id === team.players.rw._id ? 'VC' : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Substitutes Bench */}
        {team.substitutes && (
          <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Substitutes Bench</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-sm text-gray-400 mb-3">Substitute 1</h3>
                <PlayerCard
                  player={convertPlayerForCard(team.substitutes.sub1)}
                  isSelected={true}
                  onSelect={() => {}}
                  showPrice={false}
                  compact={true}
                />
              </div>
              <div className="text-center">
                <h3 className="text-sm text-gray-400 mb-3">Substitute 2</h3>
                <PlayerCard
                  player={convertPlayerForCard(team.substitutes.sub2)}
                  isSelected={true}
                  onSelect={() => {}}
                  showPrice={false}
                  compact={true}
                />
              </div>
              <div className="text-center">
                <h3 className="text-sm text-gray-400 mb-3">Substitute 3</h3>
                <PlayerCard
                  player={convertPlayerForCard(team.substitutes.sub3)}
                  isSelected={true}
                  onSelect={() => {}}
                  showPrice={false}
                  compact={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Team Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/transfers')}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105"
          >
            <Edit3 className="w-5 h-5" />
            <span>Make Transfers</span>
          </button>
          
          <button
            onClick={() => navigate('/fixtures')}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105"
          >
            <Calendar className="w-5 h-5" />
            <span>View Fixtures</span>
          </button>
          
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-500 hover:to-purple-400 transition-all duration-200 transform hover:scale-105"
          >
            <Award className="w-5 h-5" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
