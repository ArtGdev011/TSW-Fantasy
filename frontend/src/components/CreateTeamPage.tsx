import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playersAPI, teamAPI, Player as APIPlayer, GAME_RULES, TeamCreateRequest } from '../services/api';
import PlayerCard, { Player as CardPlayer } from './PlayerCard';
import BudgetBar from './BudgetBar';
import CaptainSelector from './CaptainSelector';
import toast from 'react-hot-toast';
import { Shield, Users, Target, CheckCircle, AlertCircle } from 'lucide-react';

interface SelectedPlayers {
  gk: APIPlayer | null;
  cdm1: APIPlayer | null;
  cdm2: APIPlayer | null;
  lw: APIPlayer | null;
  rw: APIPlayer | null;
}

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

const CreateTeamPage: React.FC = () => {
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
  const [teamName, setTeamName] = useState('');
  const [captain, setCaptain] = useState<APIPlayer | null>(null);
  const [viceCaptain, setViceCaptain] = useState<APIPlayer | null>(null);
  const [currentStep, setCurrentStep] = useState<'selection' | 'captains' | 'confirm'>('selection');
  const [submitting, setSubmitting] = useState(false);
  const [activePosition, setActivePosition] = useState<'GK' | 'CDM' | 'WINGER'>('GK');

  // Calculate budget and validation
  const selectedPlayersList = Object.values(selectedPlayers).filter(Boolean) as APIPlayer[];
  const totalCost = selectedPlayersList.reduce((sum, player) => sum + player.price, 0);
  const budgetRemaining = GAME_RULES.STARTING_BUDGET - totalCost;
  const isValidTeam = selectedPlayersList.length === 5 && budgetRemaining >= 0;
  const averageRating = selectedPlayersList.length > 0 
    ? Math.round(selectedPlayersList.reduce((sum, p) => sum + p.overall, 0) / selectedPlayersList.length)
    : 0;

  useEffect(() => {
    // Auto-clear selections for user artgashi (temporary fix)
    const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username');
    if (currentUser === 'artgashi') {
      // Clear any stored selections
      localStorage.removeItem('selectedPlayers');
      localStorage.removeItem('teamData');
      sessionStorage.removeItem('selectedPlayers');
      sessionStorage.removeItem('teamData');
      
      // Reset state to ensure clean start
      setSelectedPlayers({
        gk: null,
        cdm1: null,
        cdm2: null,
        lw: null,
        rw: null,
      });
      setCaptain(null);
      setViceCaptain(null);
      setTeamName('');
      setCurrentStep('selection');
    }
    
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

  const selectPlayer = (player: APIPlayer, position: keyof SelectedPlayers) => {
    // Check if player is already selected
    const isAlreadySelected = Object.values(selectedPlayers).some(p => p?._id === player._id);
    if (isAlreadySelected) {
      toast.error(`${player.name} is already selected in your team`);
      return;
    }

    // Check if player is owned by another user
    if (player.isOwned) {
      toast.error(`${player.name} is already owned by another manager`);
      return;
    }

    // Check budget constraint
    const newSelectedPlayers = { ...selectedPlayers, [position]: player };
    const newTotalCost = Object.values(newSelectedPlayers)
      .filter(Boolean)
      .reduce((sum, p) => sum + (p as APIPlayer).price, 0);
    
    if (newTotalCost > GAME_RULES.STARTING_BUDGET) {
      toast.error(`Cannot select ${player.name} - would exceed budget (${newTotalCost}M > ${GAME_RULES.STARTING_BUDGET}M)`);
      return;
    }

    // Validate position constraints
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

    setSelectedPlayers(newSelectedPlayers);
    toast.success(`${player.name} added to your team!`);
  };

  const removePlayer = (position: keyof SelectedPlayers) => {
    const player = selectedPlayers[position];
    if (!player) return;
    
    setSelectedPlayers(prev => ({ ...prev, [position]: null }));
    
    // Remove from captains if selected
    if (captain?._id === player._id) setCaptain(null);
    if (viceCaptain?._id === player._id) setViceCaptain(null);
    
    toast.success(`${player.name} removed from team`);
  };

  const resetAllSelections = () => {
    setSelectedPlayers({
      gk: null,
      cdm1: null,
      cdm2: null,
      lw: null,
      rw: null,
    });
    setCaptain(null);
    setViceCaptain(null);
    setTeamName('');
    setCurrentStep('selection');
    toast.success('All selections cleared');
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
          sub1: '',
          sub2: '',
          sub3: '',
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

  const filteredPlayers = players.filter(player => {
    if (activePosition === 'GK') return player.position === 'GK';
    if (activePosition === 'CDM') return player.position === 'CDM';
    if (activePosition === 'WINGER') return player.position === 'LW' || player.position === 'RW';
    return false;
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
            Build your ultimate team with a {GAME_RULES.STARTING_BUDGET}M budget
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Team Selection Panel */}
            <div className="lg:col-span-1">
              <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 sticky top-8">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Your Team</h3>
                
                {/* Team Formation */}
                <div className="space-y-4">
                  {/* Goalkeeper */}
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">GK</div>
                    {selectedPlayers.gk ? (
                      <div className="relative group">
                        <PlayerCard 
                          player={convertPlayerForCard(selectedPlayers.gk!)} 
                          isSelected={true}
                          onSelect={() => {}}
                          showPrice={false}
                          compact={true}
                        />
                        <button
                          onClick={() => removePlayer('gk')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Select GK</span>
                      </div>
                    )}
                  </div>

                  {/* CDMs */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['cdm1', 'cdm2'] as const).map((pos, index) => (
                      <div key={pos} className="text-center">
                        <div className="text-sm text-gray-400 mb-2">CDM {index + 1}</div>
                        {selectedPlayers[pos] ? (
                          <div className="relative group">
                            <PlayerCard 
                              player={convertPlayerForCard(selectedPlayers[pos]!)} 
                              isSelected={true}
                              onSelect={() => {}}
                              showPrice={false}
                              compact={true}
                            />
                            <button
                              onClick={() => removePlayer(pos)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="h-20 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">Select CDM</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Wingers */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-2">LW</div>
                      {selectedPlayers.lw ? (
                        <div className="relative group">
                          <PlayerCard 
                            player={convertPlayerForCard(selectedPlayers.lw!)} 
                            isSelected={true}
                            onSelect={() => {}}
                            showPrice={false}
                            compact={true}
                          />
                          <button
                            onClick={() => removePlayer('lw')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Select LW</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-2">RW</div>
                      {selectedPlayers.rw ? (
                        <div className="relative group">
                          <PlayerCard 
                            player={convertPlayerForCard(selectedPlayers.rw!)} 
                            isSelected={true}
                            onSelect={() => {}}
                            showPrice={false}
                            compact={true}
                          />
                          <button
                            onClick={() => removePlayer('rw')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Select RW</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-white">{selectedPlayersList.length}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Cost:</span>
                      <span className="text-white">{totalCost}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remaining:</span>
                      <span className={budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {budgetRemaining}M
                      </span>
                    </div>
                    {selectedPlayersList.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Avg Rating:</span>
                        <span className="text-white">{averageRating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    {selectedPlayersList.length > 0 && (
                      <button
                        onClick={resetAllSelections}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                      >
                        Clear All Selections
                      </button>
                    )}
                    
                    <button
                      onClick={proceedToCaptains}
                      disabled={!isValidTeam || !teamName.trim()}
                      className="w-full bg-gradient-to-r from-tsw-blue to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {!teamName.trim() ? 'Enter Team Name' : 
                       !isValidTeam ? `Select ${5 - selectedPlayersList.length} More` : 
                       'Choose Captains →'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="lg:col-span-3">
              {/* Position Filter */}
              <div className="flex space-x-4 mb-6">
                {[
                  { key: 'GK', label: 'Goalkeepers', icon: Shield },
                  { key: 'CDM', label: 'CDMs', icon: Users },
                  { key: 'WINGER', label: 'Wingers', icon: Target },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActivePosition(key as any)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      activePosition === key
                        ? 'bg-tsw-blue text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Players Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPlayers.map(player => {
                  const isSelected = Object.values(selectedPlayers).some(p => p?._id === player._id);
                  const canAfford = totalCost + player.price <= GAME_RULES.STARTING_BUDGET || isSelected;
                  
                  return (
                    <PlayerCard
                      key={player._id}
                      player={convertPlayerForCard(player)}
                      isSelected={isSelected}
                      onSelect={() => {
                        // Determine which position to fill
                        if (player.position === 'GK') {
                          selectPlayer(player, 'gk');
                        } else if (player.position === 'CDM') {
                          if (!selectedPlayers.cdm1) selectPlayer(player, 'cdm1');
                          else if (!selectedPlayers.cdm2) selectPlayer(player, 'cdm2');
                          else toast.error('You already have 2 CDMs selected');
                        } else if (player.position === 'LW' || player.position === 'RW') {
                          if (!selectedPlayers.lw) selectPlayer(player, 'lw');
                          else if (!selectedPlayers.rw) selectPlayer(player, 'rw');
                          else toast.error('You already have 2 wingers selected');
                        }
                      }}
                      disabled={player.isOwned || (!canAfford && !isSelected)}
                      showPrice={true}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Captain Selection Step */}
        {currentStep === 'captains' && (
          <CaptainSelector
            players={selectedPlayersList}
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
          <div className="max-w-4xl mx-auto">
            <div className="bg-tsw-dark rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Confirm Your Team</h2>
              
              <div className="space-y-6">
                {/* Team Name */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-tsw-blue">{teamName}</h3>
                </div>

                {/* Team Formation Visual */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-5 text-center">
                    <PlayerCard 
                      player={convertPlayerForCard(selectedPlayers.gk!)} 
                      isSelected={true}
                      onSelect={() => {}}
                      showPrice={false}
                      captain={captain?._id === selectedPlayers.gk!._id ? 'C' : 
                              viceCaptain?._id === selectedPlayers.gk!._id ? 'VC' : undefined}
                    />
                  </div>
                  <div className="col-span-2">
                    <PlayerCard 
                      player={convertPlayerForCard(selectedPlayers.cdm1!)} 
                      isSelected={true}
                      onSelect={() => {}}
                      showPrice={false}
                      captain={captain?._id === selectedPlayers.cdm1!._id ? 'C' : 
                              viceCaptain?._id === selectedPlayers.cdm1!._id ? 'VC' : undefined}
                    />
                  </div>
                  <div className="col-span-1"></div>
                  <div className="col-span-2">
                    <PlayerCard 
                      player={convertPlayerForCard(selectedPlayers.cdm2!)} 
                      isSelected={true}
                      onSelect={() => {}}
                      showPrice={false}
                      captain={captain?._id === selectedPlayers.cdm2!._id ? 'C' : 
                              viceCaptain?._id === selectedPlayers.cdm2!._id ? 'VC' : undefined}
                    />
                  </div>
                  <div className="col-span-2">
                    <PlayerCard 
                      player={convertPlayerForCard(selectedPlayers.lw!)} 
                      isSelected={true}
                      onSelect={() => {}}
                      showPrice={false}
                      captain={captain?._id === selectedPlayers.lw!._id ? 'C' : 
                              viceCaptain?._id === selectedPlayers.lw!._id ? 'VC' : undefined}
                    />
                  </div>
                  <div className="col-span-1"></div>
                  <div className="col-span-2">
                    <PlayerCard 
                      player={convertPlayerForCard(selectedPlayers.rw!)} 
                      isSelected={true}
                      onSelect={() => {}}
                      showPrice={false}
                      captain={captain?._id === selectedPlayers.rw!._id ? 'C' : 
                              viceCaptain?._id === selectedPlayers.rw!._id ? 'VC' : undefined}
                    />
                  </div>
                </div>

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
                      <div className="text-2xl font-bold text-tsw-blue">5</div>
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

export default CreateTeamPage;
