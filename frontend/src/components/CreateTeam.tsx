import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Player } from './PlayerCard';
import Market from './Market';
import TeamSummary from './TeamSummary';
import { 
  ArrowLeftIcon, 
  StarIcon, 
  ShieldCheckIcon,
  CheckBadgeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const CreateTeam: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [captain, setCaptain] = useState<Player | null>(null);
  const [viceCaptain, setViceCaptain] = useState<Player | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showCaptainSelection, setShowCaptainSelection] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const maxBudget = 100; // £100M budget
  const totalCost = selectedPlayers.reduce((sum, player) => sum + player.price, 0);

  // Handle player selection
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      
      if (isSelected) {
        // Remove player
        const newPlayers = prev.filter(p => p.id !== player.id);
        
        // Remove captain/vice captain if they were removed
        if (captain?.id === player.id) setCaptain(null);
        if (viceCaptain?.id === player.id) setViceCaptain(null);
        
        return newPlayers;
      } else {
        // Add player (if under limit and budget allows)
        if (prev.length < 5 && totalCost + player.price <= maxBudget) {
          const newPlayers = [...prev, player];
          
          // Auto-suggest captain if none selected and this is a high-rated player
          if (!captain && player.overall >= 85) {
            setCaptain(player);
          }
          
          return newPlayers;
        }
        return prev;
      }
    });
  };

  // Handle captain selection
  const handleCaptainSelect = (player: Player) => {
    if (captain?.id === player.id) {
      setCaptain(null);
    } else {
      setCaptain(player);
      // If this player was vice captain, clear that
      if (viceCaptain?.id === player.id) {
        setViceCaptain(null);
      }
    }
  };

  // Handle vice captain selection
  const handleViceCaptainSelect = (player: Player) => {
    if (viceCaptain?.id === player.id) {
      setViceCaptain(null);
    } else {
      setViceCaptain(player);
      // If this player was captain, clear that
      if (captain?.id === player.id) {
        setCaptain(null);
      }
    }
  };

  // Progress through team creation steps
  useEffect(() => {
    if (selectedPlayers.length === 5 && !showCaptainSelection) {
      setCurrentStep(2);
      setTimeout(() => setShowCaptainSelection(true), 500);
    } else if (selectedPlayers.length < 5) {
      setCurrentStep(1);
      setShowCaptainSelection(false);
    }
  }, [selectedPlayers.length]);

  // Lock team
  const handleLockTeam = async () => {
    if (!captain || !viceCaptain || selectedPlayers.length !== 5) return;
    
    setIsLocking(true);
    
    try {
      // Send team to backend
      const teamData = {
        players: selectedPlayers.map(p => p.id),
        captain: captain.id,
        viceCaptain: viceCaptain.id,
        budget: totalCost
      };
      
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success! Team created
      console.log('Team created:', teamData);
      
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray">
      {/* Header */}
      <div className="border-b border-tsw-blue/20 bg-tsw-dark/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                <SparklesIcon className="h-8 w-8 text-tsw-blue" />
                <div>
                  <h1 className="text-xl font-gaming font-bold text-white">TSW GURU</h1>
                  <p className="text-xs text-gray-400">Create Your Squad</p>
                </div>
              </motion.div>
            </div>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                currentStep >= 1 ? 'bg-tsw-blue text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                {currentStep > 1 ? <CheckBadgeIcon className="h-4 w-4" /> : <span>1</span>}
                <span>Select Squad</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-600"></div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                currentStep >= 2 ? 'bg-tsw-blue text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                {captain && viceCaptain ? <CheckBadgeIcon className="h-4 w-4" /> : <span>2</span>}
                <span>Choose Leaders</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>Welcome, {user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Step 1: Squad Selection */}
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="squad-selection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Build Your Squad
                    </h2>
                    <p className="text-gray-400">
                      Select exactly 5 players within your £{maxBudget}M budget. 
                      You need: 1 GK, 2 CDM, 1 LW, 1 RW
                    </p>
                  </div>

                  <Market
                    selectedPlayers={selectedPlayers}
                    onPlayerSelect={handlePlayerSelect}
                    budget={totalCost}
                    maxBudget={maxBudget}
                  />
                </motion.div>
              )}

              {/* Step 2: Captain Selection */}
              {currentStep === 2 && showCaptainSelection && (
                <motion.div
                  key="captain-selection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-16 h-16 bg-gradient-to-br from-tsw-blue to-tsw-red rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <StarIcon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Choose Your Leaders
                    </h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Select your captain (2x points) and vice captain (1.5x points if captain doesn't play)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedPlayers.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          relative p-4 bg-gradient-to-br from-tsw-gray to-tsw-black border rounded-2xl cursor-pointer transition-all
                          ${captain?.id === player.id 
                            ? 'border-yellow-400 shadow-lg shadow-yellow-400/25' 
                            : viceCaptain?.id === player.id
                              ? 'border-gray-400 shadow-lg shadow-gray-400/25'
                              : 'border-gray-600 hover:border-tsw-blue'
                          }
                        `}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-tsw-blue to-tsw-red rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-white font-bold">{player.overall}</span>
                          </div>
                          
                          <h3 className="font-bold text-white mb-1">{player.name}</h3>
                          <p className="text-sm text-gray-400 mb-3">{player.position} • {player.club}</p>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCaptainSelect(player)}
                              className={`
                                flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all
                                ${captain?.id === player.id
                                  ? 'bg-yellow-400 text-black'
                                  : 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
                                }
                              `}
                            >
                              <StarIcon className="h-3 w-3 inline mr-1" />
                              Captain
                            </button>
                            
                            <button
                              onClick={() => handleViceCaptainSelect(player)}
                              className={`
                                flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all
                                ${viceCaptain?.id === player.id
                                  ? 'bg-gray-400 text-black'
                                  : 'bg-gray-400/20 text-gray-400 hover:bg-gray-400/30'
                                }
                              `}
                            >
                              <ShieldCheckIcon className="h-3 w-3 inline mr-1" />
                              Vice
                            </button>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {(captain?.id === player.id || viceCaptain?.id === player.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2"
                          >
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                              ${captain?.id === player.id 
                                ? 'bg-yellow-400 text-black' 
                                : 'bg-gray-400 text-white'
                              }
                            `}>
                              {captain?.id === player.id ? 'C' : 'VC'}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Back Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center gap-2 px-6 py-3 bg-tsw-gray hover:bg-tsw-gray/80 text-white rounded-xl transition-colors"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Back to Squad Selection
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Team Summary Sidebar */}
          <div className="lg:col-span-1">
            <TeamSummary
              selectedPlayers={selectedPlayers}
              captain={captain}
              viceCaptain={viceCaptain}
              budget={totalCost}
              maxBudget={maxBudget}
              onLockTeam={handleLockTeam}
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLocking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-tsw-dark to-tsw-black border border-tsw-blue/20 rounded-3xl p-8 text-center max-w-md mx-4"
            >
              <div className="w-16 h-16 border-4 border-tsw-blue/30 border-t-tsw-blue rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Locking in Your Team</h3>
              <p className="text-gray-400">Preparing your squad for domination...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateTeam;
