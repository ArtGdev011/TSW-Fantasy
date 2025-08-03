import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playersAPI, teamAPI, Player as APIPlayer, GAME_RULES, TeamCreateRequest } from '../services/api';
import { clearTeamData, resetPlayerOwnership } from '../utils/teamUtils';
import PlayerCard, { Player as CardPlayer } from './PlayerCard';
import BudgetBar from './BudgetBar';
import CaptainSelector from './CaptainSelector';
import FootballField from './FootballField';
import toast from 'react-hot-toast';
import { Users, Target, CheckCircle, Search } from 'lucide-react';

interface SelectedPlayers {
  gk: APIPlayer | null;
  cdm1: APIPlayer | null;
  cdm2: APIPlayer | null;
  lw: APIPlayer | null;
  rw: APIPlayer | null;
}

interface SelectedSubstitutes {
  sub1: APIPlayer | null;
  sub2: APIPlayer | null;
  sub3: APIPlayer | null;
}

// Helper function to convert APIPlayer to CardPlayer
const convertPlayerForCard = (player: APIPlayer): CardPlayer => ({
  id: player._id,
  name: player.name,
  position: player.position,
  region: player.region,
  club: player.region,
  overall: player.overall,
  price: player.price,
  form: 75,
  selected: 0,
});

const EnhancedCreateTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<APIPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayers>({
    gk: null,
    cdm1: null,
    cdm2: null,
    lw: null,
    rw: null,
  });
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<SelectedSubstitutes>({
    sub1: null,
    sub2: null,
    sub3: null,
  });
  const [teamName, setTeamName] = useState('');
  const [captain, setCaptain] = useState<APIPlayer | null>(null);
  const [viceCaptain, setViceCaptain] = useState<APIPlayer | null>(null);
  const [currentStep, setCurrentStep] = useState<'selection' | 'captains' | 'confirm'>('selection');
  const [submitting, setSubmitting] = useState(false);
  const [activePosition, setActivePosition] = useState<'ALL' | 'GK' | 'CDM' | 'WINGER'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'NA' | 'EU'>('ALL');

  // Calculate totals
  const allSelectedPlayersList = [
    ...Object.values(selectedPlayers).filter(Boolean),
    ...Object.values(selectedSubstitutes).filter(Boolean)
  ] as APIPlayer[];
  const startingPlayersList = Object.values(selectedPlayers).filter(Boolean) as APIPlayer[];
  const totalCost = allSelectedPlayersList.reduce((sum, player) => sum + player.price, 0);
  const budgetRemaining = GAME_RULES.STARTING_BUDGET - totalCost;
  const isValidTeam = allSelectedPlayersList.length === GAME_RULES.MIN_PLAYERS && budgetRemaining >= 0;
  const averageRating = allSelectedPlayersList.length > 0 
    ? Math.round(allSelectedPlayersList.reduce((sum, p) => sum + p.overall, 0) / allSelectedPlayersList.length)
    : 0;

  useEffect(() => {
    // Clear any previous team data when starting team creation
    console.log('🧹 Clearing previous team data for fresh start...');
    clearTeamData();
    resetPlayerOwnership();
    
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await playersAPI.getAvailable();
      setPlayers(response.players);
    } catch (error) {
      toast.error('Failed to load players');
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerDrop = (position: string, player: APIPlayer) => {
    // Check if player is already selected
    const isAlreadySelected = allSelectedPlayersList.some(p => p._id === player._id);
    if (isAlreadySelected) {
      toast.error(`${player.name} is already selected in your team`);
      return;
    }

    // Check if player is owned by another user
    if (player.isOwned) {
      toast.error(`${player.name} is already owned by another manager`);
      return;
    }

    // Calculate new cost
    const currentPlayerInPosition = position.startsWith('sub') 
      ? selectedSubstitutes[position as keyof SelectedSubstitutes]
      : selectedPlayers[position as keyof SelectedPlayers];
    
    const costWithoutCurrentPlayer = currentPlayerInPosition 
      ? totalCost - currentPlayerInPosition.price 
      : totalCost;
    const newTotalCost = costWithoutCurrentPlayer + player.price;
    
    if (newTotalCost > GAME_RULES.STARTING_BUDGET) {
      toast.error(`Cannot select ${player.name} - would exceed budget (${newTotalCost}M > ${GAME_RULES.STARTING_BUDGET}M)`);
      return;
    }

    // Validate position constraints for starting XI
    if (!position.startsWith('sub')) {
      if (position === 'gk' && player.position !== 'GK') {
        toast.error(`${player.name} cannot play as goalkeeper`);
        return;
      }
      
      if ((position === 'cdm1' || position === 'cdm2') && player.position !== 'CDM') {
        toast.error(`${player.name} cannot play as CDM`);
        return;
      }
      
      if ((position === 'lw' || position === 'rw') && 
          player.position !== 'LW' && player.position !== 'RW') {
        toast.error(`${player.name} cannot play as winger`);
        return;
      }
    }

    // Update the appropriate state
    if (position.startsWith('sub')) {
      setSelectedSubstitutes(prev => ({ ...prev, [position]: player }));
    } else {
      setSelectedPlayers(prev => ({ ...prev, [position]: player }));
    }

    // Remove from captains if replacing
    if (currentPlayerInPosition) {
      if (captain?._id === currentPlayerInPosition._id) setCaptain(null);
      if (viceCaptain?._id === currentPlayerInPosition._id) setViceCaptain(null);
    }

    toast.success(`${player.name} added to your team!`);
  };

  const removePlayer = (position: string) => {
    const player = position.startsWith('sub') 
      ? selectedSubstitutes[position as keyof SelectedSubstitutes]
      : selectedPlayers[position as keyof SelectedPlayers];
    
    if (!player) return;
    
    if (position.startsWith('sub')) {
      setSelectedSubstitutes(prev => ({ ...prev, [position]: null }));
    } else {
      setSelectedPlayers(prev => ({ ...prev, [position]: null }));
    }
    
    // Remove from captains if selected
    if (captain?._id === player._id) setCaptain(null);
    if (viceCaptain?._id === player._id) setViceCaptain(null);
    
    toast.success(`${player.name} removed from team`);
  };

  const handlePlayerDrag = (e: React.DragEvent, player: APIPlayer) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(player));
  };

  const proceedToCaptains = () => {
    if (!isValidTeam) {
      toast.error('Please complete your team selection first');
      return;
    }
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    setCurrentStep('captains');
  };

  const proceedToConfirm = () => {
    if (!captain || !viceCaptain) {
      toast.error('Please select both Captain and Vice-Captain');
      return;
    }
    setCurrentStep('confirm');
  };

  const submitTeam = async () => {
    if (!isValidTeam || !captain || !viceCaptain || !teamName.trim()) {
      toast.error('Please complete all team requirements');
      return;
    }

    try {
      setSubmitting(true);
      
      const teamData: TeamCreateRequest = {
        name: teamName.trim(),
        players: {
          gk: selectedPlayers.gk!._id,
          cdm1: selectedPlayers.cdm1!._id,
          cdm2: selectedPlayers.cdm2!._id,
          lw: selectedPlayers.lw!._id,
          rw: selectedPlayers.rw!._id,
        },
        substitutes: {
          sub1: selectedSubstitutes.sub1!._id,
          sub2: selectedSubstitutes.sub2!._id,
          sub3: selectedSubstitutes.sub3!._id,
        },
        captain: captain._id,
        viceCaptain: viceCaptain._id,
      };
      
      const response = await teamAPI.create(teamData);
      
      toast.success(response.message);
      
      // Navigate to team page
      setTimeout(() => {
        navigate('/team');
      }, 1500);
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter players based on search and filters
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = activePosition === 'ALL' || 
      (activePosition === 'GK' && player.position === 'GK') ||
      (activePosition === 'CDM' && player.position === 'CDM') ||
      (activePosition === 'WINGER' && (player.position === 'LW' || player.position === 'RW'));
    const matchesRegion = regionFilter === 'ALL' || player.region === regionFilter;
    
    return matchesSearch && matchesPosition && matchesRegion;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tsw-blue/30 border-t-tsw-blue rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Players</h2>
          <p className="text-gray-400">Preparing the transfer market...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-tsw-blue to-tsw-red bg-clip-text text-transparent mb-4">
            Create Your TSW Fantasy Team
          </h1>
          <p className="text-gray-400 text-lg">
            Build your ultimate team with a {GAME_RULES.STARTING_BUDGET}M budget • 5 Starters + 3 Substitutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
              currentStep === 'selection' ? 'bg-tsw-blue text-white' : 'bg-gray-800 text-gray-400'
            }`}>
              <Users className="w-5 h-5" />
              <span>Select Players</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-700"></div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
              currentStep === 'captains' ? 'bg-tsw-blue text-white' : 'bg-gray-800 text-gray-400'
            }`}>
              <Target className="w-5 h-5" />
              <span>Choose Captains</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-700"></div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
              currentStep === 'confirm' ? 'bg-tsw-blue text-white' : 'bg-gray-800 text-gray-400'
            }`}>
              <CheckCircle className="w-5 h-5" />
              <span>Confirm</span>
            </div>
          </div>
        </div>

        {/* Team Name Input (Selection Step) */}
        {currentStep === 'selection' && (
          <div className="mb-8">
            <div className="max-w-md mx-auto">
              <label className="block text-white font-semibold mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name..."
                className="w-full px-4 py-3 bg-tsw-dark border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-tsw-blue focus:ring-2 focus:ring-tsw-blue/20 focus:outline-none"
                maxLength={30}
              />
            </div>
          </div>
        )}

        {/* Budget Bar */}
        <BudgetBar 
          totalBudget={GAME_RULES.STARTING_BUDGET}
          spent={totalCost}
          remaining={budgetRemaining}
        />

        {/* Main Content */}
        {currentStep === 'selection' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Football Field */}
            <div className="xl:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Team Formation</h2>
                <p className="text-gray-400 mb-4">Drag and drop players from the market onto the field</p>
                <FootballField
                  players={selectedPlayers}
                  substitutes={selectedSubstitutes}
                  captain={captain}
                  viceCaptain={viceCaptain}
                  onPlayerRemove={removePlayer}
                  onDrop={handlePlayerDrop}
                />
              </div>

              {/* Team Stats */}
              <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Team Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{allSelectedPlayersList.length}/8</div>
                    <div className="text-gray-400 text-sm">Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalCost}M</div>
                    <div className="text-gray-400 text-sm">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {budgetRemaining}M
                    </div>
                    <div className="text-gray-400 text-sm">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{averageRating}</div>
                    <div className="text-gray-400 text-sm">Avg Rating</div>
                  </div>
                </div>
                
                <button
                  onClick={proceedToCaptains}
                  disabled={!isValidTeam || !teamName.trim()}
                  className="w-full mt-6 bg-gradient-to-r from-tsw-blue to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {!teamName.trim() ? 'Enter Team Name' : 
                   !isValidTeam ? `Select ${GAME_RULES.MIN_PLAYERS - allSelectedPlayersList.length} More Players` : 
                   'Choose Captains →'}
                </button>
              </div>
            </div>

            {/* Player Market */}
            <div className="xl:col-span-1">
              <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 sticky top-8">
                <h3 className="text-xl font-bold text-white mb-6">Transfer Market</h3>
                
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search players..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-tsw-blue focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <select
                      value={activePosition}
                      onChange={(e) => setActivePosition(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-tsw-blue focus:outline-none"
                    >
                      <option value="ALL">All Positions</option>
                      <option value="GK">Goalkeepers</option>
                      <option value="CDM">CDMs</option>
                      <option value="WINGER">Wingers</option>
                    </select>
                    
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-tsw-blue focus:outline-none"
                    >
                      <option value="ALL">All Regions</option>
                      <option value="NA">North America</option>
                      <option value="EU">Europe</option>
                    </select>
                  </div>
                </div>

                {/* Players List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPlayers.map(player => {
                    const isSelected = allSelectedPlayersList.some(p => p._id === player._id);
                    const canAfford = totalCost + player.price <= GAME_RULES.STARTING_BUDGET || isSelected;
                    
                    return (
                      <div
                        key={player._id}
                        draggable={!player.isOwned && canAfford}
                        onDragStart={(e) => handlePlayerDrag(e, player)}
                        className={`cursor-grab active:cursor-grabbing ${
                          !canAfford || player.isOwned ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <PlayerCard
                          player={convertPlayerForCard(player)}
                          isSelected={isSelected}
                          onSelect={() => {}}
                          disabled={player.isOwned || (!canAfford && !isSelected)}
                          showPrice={true}
                          compact={true}
                          draggable={true}
                        />
                      </div>
                    );
                  })}
                  
                  {filteredPlayers.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-400">No players found</div>
                      <div className="text-sm text-gray-500 mt-1">Try adjusting your filters</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Captain Selection Step */}
        {currentStep === 'captains' && (
          <CaptainSelector
            players={startingPlayersList}
            captain={captain}
            viceCaptain={viceCaptain}
            onCaptainSelect={setCaptain}
            onViceCaptainSelect={setViceCaptain}
            onBack={() => setCurrentStep('selection')}
            onNext={proceedToConfirm}
          />
        )}

        {/* Confirmation Step */}
        {currentStep === 'confirm' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-tsw-dark rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Confirm Your Team</h2>
              
              <div className="space-y-6">
                {/* Team Name */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-tsw-blue">{teamName}</h3>
                </div>

                {/* Final Team Display */}
                <FootballField
                  players={selectedPlayers}
                  substitutes={selectedSubstitutes}
                  captain={captain}
                  viceCaptain={viceCaptain}
                  onPlayerRemove={() => {}}
                  onDrop={() => {}}
                />

                {/* Team Summary */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{totalCost}M</div>
                      <div className="text-gray-400 text-sm">Total Cost</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{budgetRemaining}M</div>
                      <div className="text-gray-400 text-sm">Remaining</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{averageRating}</div>
                      <div className="text-gray-400 text-sm">Avg Rating</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-tsw-blue">8</div>
                      <div className="text-gray-400 text-sm">Players</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep('captains')}
                    className="flex-1 bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={submitTeam}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Team...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Create Team</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCreateTeamPage;
