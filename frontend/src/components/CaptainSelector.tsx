import React from 'react';
import { Player } from '../services/api';
import PlayerCard from './PlayerCard';
import { Crown, Star, ArrowLeft, ArrowRight } from 'lucide-react';

interface CaptainSelectorProps {
  players: Player[];
  captain: Player | null;
  viceCaptain: Player | null;
  onCaptainSelect: (player: Player) => void;
  onViceCaptainSelect: (player: Player) => void;
  onBack: () => void;
  onNext: () => void;
}

const CaptainSelector: React.FC<CaptainSelectorProps> = ({
  players,
  captain,
  viceCaptain,
  onCaptainSelect,
  onViceCaptainSelect,
  onBack,
  onNext,
}) => {
  const handleCaptainSelect = (player: Player) => {
    if (viceCaptain?._id === player._id) {
      // If selecting current vice-captain as captain, clear vice-captain
      onViceCaptainSelect(captain || players.find(p => p._id !== player._id)!);
    }
    onCaptainSelect(player);
  };

  const handleViceCaptainSelect = (player: Player) => {
    if (captain?._id === player._id) {
      // If selecting current captain as vice-captain, clear captain
      onCaptainSelect(viceCaptain || players.find(p => p._id !== player._id)!);
    }
    onViceCaptainSelect(player);
  };

  const isComplete = captain && viceCaptain && captain._id !== viceCaptain._id;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Your Leaders</h2>
        <p className="text-gray-400 text-lg">
          Select a Captain and Vice-Captain from your team. They cannot be the same player.
        </p>
      </div>

      {/* Captain Selection */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Captain</h3>
            <p className="text-gray-400">Your team leader - gets double points!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {players.map(player => (
            <div key={`captain-${player._id}`} className="relative">
              <PlayerCard
                player={{
                  id: player._id,
                  name: player.name,
                  position: player.position,
                  region: player.region,
                  club: player.region, // Using region as club for now
                  price: player.price,
                  overall: player.overall,
                  form: 75, // Default form
                  selected: 0, // Default value
                }}
                isSelected={captain?._id === player._id}
                onSelect={() => handleCaptainSelect(player)}
                showPrice={false}
                captain={captain?._id === player._id ? 'C' : undefined}
              />
              {captain?._id === player._id && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                  C
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vice-Captain Selection */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl">
            <Star className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Vice-Captain</h3>
            <p className="text-gray-400">Your backup leader - gets 1.5x points!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {players.map(player => (
            <div key={`vice-captain-${player._id}`} className="relative">
              <PlayerCard
                player={{
                  id: player._id,
                  name: player.name,
                  position: player.position,
                  region: player.region,
                  club: player.region, // Using region as club for now
                  price: player.price,
                  overall: player.overall,
                  form: 75, // Default form
                  selected: 0, // Default value
                }}
                isSelected={viceCaptain?._id === player._id}
                onSelect={() => handleViceCaptainSelect(player)}
                showPrice={false}
                captain={viceCaptain?._id === player._id ? 'VC' : undefined}
                disabled={captain?._id === player._id}
              />
              {viceCaptain?._id === player._id && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs shadow-lg">
                  VC
                </div>
              )}
              {captain?._id === player._id && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <div className="text-white text-center">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-sm font-semibold">Already Captain</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {(captain || viceCaptain) && (
        <div className="bg-tsw-dark rounded-2xl p-6 border border-gray-700 mb-8">
          <h4 className="text-lg font-bold text-white mb-4">Leadership Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {captain && (
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-yellow-400 font-semibold">Captain</div>
                  <div className="text-white font-bold">{captain.name}</div>
                  <div className="text-gray-400 text-sm">{captain.position} • 2x Points</div>
                </div>
              </div>
            )}
            
            {viceCaptain && (
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-500/20 rounded-xl">
                <div className="p-2 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-gray-300 font-semibold">Vice-Captain</div>
                  <div className="text-white font-bold">{viceCaptain.name}</div>
                  <div className="text-gray-400 text-sm">{viceCaptain.position} • 1.5x Points</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {captain && viceCaptain && captain._id === viceCaptain._id && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-center space-x-2 text-red-400">
            <Crown className="w-5 h-5" />
            <span className="font-semibold">Captain and Vice-Captain cannot be the same player</span>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Team Selection</span>
        </button>
        
        <button
          onClick={onNext}
          disabled={!isComplete}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-tsw-blue to-blue-600 text-white font-semibold rounded-xl hover:from-tsw-blue/90 hover:to-blue-600/90 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span>
            {!captain ? 'Select Captain' : 
             !viceCaptain ? 'Select Vice-Captain' : 
             captain._id === viceCaptain._id ? 'Choose Different Players' : 
             'Continue to Confirmation'}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CaptainSelector;
