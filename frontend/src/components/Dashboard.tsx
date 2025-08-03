import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';
import { 
  Trophy, 
  Users, 
  Plus, 
  Calendar,
  TrendingUp,
  Crown,
  Target
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTeamStatus();
  }, []);

  const checkTeamStatus = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.get();
      setHasTeam(!!response.team);
    } catch (error) {
      console.error('Error checking team status:', error);
      setHasTeam(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tsw-blue/30 border-t-tsw-blue rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Dashboard</h2>
          <p className="text-gray-400">Checking your team status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-tsw-blue via-purple-500 to-tsw-red bg-clip-text text-transparent">
              TSW Fantasy
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Build your ultimate TSW team and compete against other managers
          </p>
        </div>

        {!hasTeam ? (
          // No Team - Show Create Team Section
          <div className="max-w-4xl mx-auto">
            <div className="bg-tsw-dark rounded-3xl p-8 border border-gray-700 text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-tsw-blue to-tsw-red rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Create Your Fantasy Team</h2>
                <p className="text-gray-400 text-lg mb-8">
                  Start your TSW Fantasy journey by building your dream team. 
                  Choose from 30 professional players across NA and EU regions with a 150M budget.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6">
                  <Target className="w-8 h-8 text-tsw-blue mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">150M Budget</h3>
                  <p className="text-gray-400 text-sm">Build your team within the salary cap</p>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-6">
                  <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">Choose Leaders</h3>
                  <p className="text-gray-400 text-sm">Select Captain (2x) & Vice-Captain (1.5x) points</p>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-6">
                  <Trophy className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">Compete & Win</h3>
                  <p className="text-gray-400 text-sm">Climb leaderboards and earn rewards</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/create-team')}
                className="bg-gradient-to-r from-tsw-blue to-blue-600 text-white font-bold py-4 px-8 rounded-2xl text-lg hover:from-tsw-blue/90 hover:to-blue-600/90 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3 mx-auto"
              >
                <Plus className="w-6 h-6" />
                <span>Create Your Team</span>
              </button>
            </div>
          </div>
        ) : (
          // Has Team - Show Dashboard
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/team')}
                    className="bg-gradient-to-r from-tsw-blue to-blue-600 text-white p-4 rounded-xl hover:from-tsw-blue/90 hover:to-blue-600/90 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3"
                  >
                    <Users className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">View Team</div>
                      <div className="text-sm opacity-80">Check your squad</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/transfers')}
                    className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3"
                  >
                    <TrendingUp className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Transfers</div>
                      <div className="text-sm opacity-80">Buy & sell players</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/fixtures')}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 rounded-xl hover:from-purple-500 hover:to-purple-400 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3"
                  >
                    <Calendar className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Fixtures</div>
                      <div className="text-sm opacity-80">Upcoming matches</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/leaderboard')}
                    className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white p-4 rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3"
                  >
                    <Trophy className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Leaderboard</div>
                      <div className="text-sm opacity-80">See rankings</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Game Rules Reminder */}
              <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-6">Team Composition Rules</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">1</div>
                    <div className="text-yellow-400 font-semibold">Goalkeeper</div>
                  </div>
                  
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">2</div>
                    <div className="text-green-400 font-semibold">CDMs</div>
                  </div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">2</div>
                    <div className="text-purple-400 font-semibold">Wingers</div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-800 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Budget Limit:</span>
                    <span className="text-white font-semibold">150M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* News/Updates */}
              <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Latest News</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-tsw-blue pl-4">
                    <div className="text-white font-semibold text-sm">Season Started!</div>
                    <div className="text-gray-400 text-xs">Fantasy league is now live</div>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="text-white font-semibold text-sm">New Players Added</div>
                    <div className="text-gray-400 text-xs">30 TSW players available</div>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <div className="text-white font-semibold text-sm">Weekly Scoring</div>
                    <div className="text-gray-400 text-xs">Points updated after matches</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">League Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Managers:</span>
                    <span className="text-white font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Players:</span>
                    <span className="text-white font-semibold">30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gameweek:</span>
                    <span className="text-white font-semibold">1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
