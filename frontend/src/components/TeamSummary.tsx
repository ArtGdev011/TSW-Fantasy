import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CurrencyDollarIcon, 
  TrophyIcon, 
  StarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Player } from './PlayerCard';

interface TeamSummaryProps {
  selectedPlayers: Player[];
  captain: Player | null;
  viceCaptain: Player | null;
  budget: number;
  maxBudget: number;
  onLockTeam: () => void;
  className?: string;
}

const TeamSummary: React.FC<TeamSummaryProps> = ({
  selectedPlayers,
  captain,
  viceCaptain,
  budget,
  maxBudget,
  onLockTeam,
  className = ''
}) => {
  const [budgetAnimation, setBudgetAnimation] = useState(false);
  
  const totalCost = selectedPlayers.reduce((sum, player) => sum + player.price, 0);
  const remainingBudget = maxBudget - totalCost;
  const budgetPercentage = (totalCost / maxBudget) * 100;
  const isOverBudget = totalCost > maxBudget;
  const averageOverall = selectedPlayers.length > 0 
    ? Math.round(selectedPlayers.reduce((sum, p) => sum + p.overall, 0) / selectedPlayers.length)
    : 0;

  // Required positions count
  const positionCounts = {
    GK: selectedPlayers.filter(p => p.position === 'GK').length,
    CDM: selectedPlayers.filter(p => p.position === 'CDM').length,
    LW: selectedPlayers.filter(p => p.position === 'LW').length,
    RW: selectedPlayers.filter(p => p.position === 'RW').length
  };

  const requiredPositions = { GK: 1, CDM: 2, LW: 1, RW: 1 };
  const isTeamComplete = Object.entries(requiredPositions).every(
    ([pos, required]) => positionCounts[pos as keyof typeof positionCounts] >= required
  );

  const canLockTeam = isTeamComplete && !isOverBudget && captain && viceCaptain;

  // Animate budget bar when it changes
  useEffect(() => {
    setBudgetAnimation(true);
    const timer = setTimeout(() => setBudgetAnimation(false), 300);
    return () => clearTimeout(timer);
  }, [totalCost]);

  return (
    <motion.div
      layout
      className={`
        bg-gradient-to-br from-tsw-dark to-tsw-black border border-tsw-blue/20 
        rounded-3xl p-6 shadow-2xl backdrop-blur-sm sticky top-4 
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-tsw-blue" />
          Team Summary
        </h2>
        <div className="text-right">
          <div className="text-sm text-gray-400">Squad Size</div>
          <div className="text-lg font-bold text-white">
            {selectedPlayers.length}/5
          </div>
        </div>
      </div>

      {/* Budget Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <CurrencyDollarIcon className="h-4 w-4" />
            Budget
          </span>
          <span className={`font-bold ${isOverBudget ? 'text-tsw-red' : 'text-tsw-green'}`}>
            £{remainingBudget.toFixed(1)}M left
          </span>
        </div>
        
        {/* Budget Bar */}
        <div className="relative h-3 bg-tsw-gray rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min(budgetPercentage, 100)}%`,
              scale: budgetAnimation ? [1, 1.05, 1] : 1
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`
              h-full rounded-full transition-all duration-300
              ${isOverBudget 
                ? 'bg-gradient-to-r from-tsw-red to-red-600' 
                : budgetPercentage > 90
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-tsw-blue to-tsw-green'
              }
            `}
          />
          {isOverBudget && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 bg-tsw-red/20"
            />
          )}
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>£{totalCost.toFixed(1)}M spent</span>
          <span>£{maxBudget}M total</span>
        </div>

        {/* Budget Warning */}
        <AnimatePresence>
          {isOverBudget && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 bg-tsw-red/20 border border-tsw-red/40 rounded-xl text-sm text-tsw-red flex items-center gap-2"
            >
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              <span>Over budget by £{(totalCost - maxBudget).toFixed(1)}M</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-tsw-gray/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{averageOverall}</div>
          <div className="text-xs text-gray-400">Avg Rating</div>
        </div>
        <div className="bg-tsw-gray/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-tsw-green">
            £{(totalCost / selectedPlayers.length || 0).toFixed(1)}M
          </div>
          <div className="text-xs text-gray-400">Avg Price</div>
        </div>
      </div>

      {/* Position Requirements */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Squad Requirements</h3>
        <div className="space-y-2">
          {Object.entries(requiredPositions).map(([position, required]) => {
            const current = positionCounts[position as keyof typeof positionCounts];
            const isComplete = current >= required;
            
            return (
              <div key={position} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{position}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isComplete ? 'text-tsw-green' : 'text-gray-400'}`}>
                    {current}/{required}
                  </span>
                  {isComplete ? (
                    <CheckCircleIcon className="h-4 w-4 text-tsw-green" />
                  ) : (
                    <div className="h-4 w-4 border border-gray-500 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Captain & Vice Captain */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Leadership</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-tsw-gray/20 rounded-xl">
            <div className="flex items-center gap-2">
              <StarIcon className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Captain</span>
            </div>
            <span className="text-sm font-medium text-white">
              {captain ? captain.name : 'Not selected'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-tsw-gray/20 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">Vice Captain</span>
            </div>
            <span className="text-sm font-medium text-white">
              {viceCaptain ? viceCaptain.name : 'Not selected'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Team Progress</span>
          <span className="text-sm font-medium text-tsw-blue">
            {Math.round(((selectedPlayers.length / 5) + (captain ? 0.5 : 0) + (viceCaptain ? 0.5 : 0)) * 50)}%
          </span>
        </div>
        <div className="h-2 bg-tsw-gray rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${((selectedPlayers.length / 5) + (captain ? 0.5 : 0) + (viceCaptain ? 0.5 : 0)) * 50}%`
            }}
            className="h-full bg-gradient-to-r from-tsw-blue to-tsw-green rounded-full"
          />
        </div>
      </div>

      {/* Lock Team Button */}
      <motion.button
        whileHover={canLockTeam ? { scale: 1.02 } : {}}
        whileTap={canLockTeam ? { scale: 0.98 } : {}}
        onClick={onLockTeam}
        disabled={!canLockTeam}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
          ${canLockTeam
            ? 'bg-gradient-to-r from-tsw-blue to-tsw-red hover:from-tsw-blue-glow hover:to-tsw-red-glow text-white shadow-lg hover:shadow-tsw-blue/25'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {!isTeamComplete ? 'Complete Squad First' :
         isOverBudget ? 'Reduce Team Cost' :
         !captain || !viceCaptain ? 'Select Captain & VC' :
         'Lock in Team'}
      </motion.button>

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        {canLockTeam ? (
          <span className="text-tsw-green">✓ Ready to dominate!</span>
        ) : (
          <span>Complete all requirements to lock your team</span>
        )}
      </div>
    </motion.div>
  );
};

export default TeamSummary;
