import React from 'react';
import { motion } from 'framer-motion';
import { StarIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'CDM' | 'LW' | 'RW';
  overall: number;
  price: number;
  region: string;
  club: string;
  form: number;
  selected: number;
  isSelected?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
  disabled?: boolean;
  showPrice?: boolean;
  compact?: boolean;
  isSelected?: boolean;
  captain?: 'C' | 'VC';
  draggable?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  onSelect, 
  disabled = false, 
  showPrice = true,
  compact = false,
  isSelected = false,
  captain,
  draggable = false
}) => {
  const getOverallColor = (overall: number) => {
    if (overall >= 85) return 'from-yellow-400 to-yellow-600';
    if (overall >= 80) return 'from-green-400 to-green-600';
    if (overall >= 75) return 'from-blue-400 to-blue-600';
    if (overall >= 70) return 'from-gray-400 to-gray-600';
    return 'from-red-400 to-red-600';
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'CDM': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'LW': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      case 'RW': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getRegionFlag = (region: string) => {
    const flags: Record<string, string> = {
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Spain': '🇪🇸',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Brazil': '🇧🇷',
      'Argentina': '🇦🇷',
      'Portugal': '🇵🇹',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪'
    };
    return flags[region] || '🌍';
  };

  return (
    <motion.div
      layout
      whileHover={{ 
        scale: disabled ? 1 : 1.03,
        y: disabled ? 0 : -4
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => !disabled && onSelect(player)}
      className={`
        relative cursor-pointer bg-gradient-to-br from-tsw-gray to-tsw-black 
        border rounded-2xl p-4 transition-all duration-200 group
        ${compact ? 'p-3' : 'p-4'}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed border-gray-600' 
          : 'hover:border-tsw-blue border-gray-600 hover:shadow-lg hover:shadow-tsw-blue/25'
        }
        ${isSelected || player.isSelected 
          ? 'border-tsw-blue shadow-lg shadow-tsw-blue/25 animate-glow' 
          : ''
        }
      `}
    >
      {/* Selection Glow Effect */}
      {(isSelected || player.isSelected) && (
        <div className="absolute inset-0 bg-gradient-to-br from-tsw-blue/10 to-tsw-red/10 rounded-2xl animate-pulse" />
      )}

      {/* Captain/Vice Captain Badges */}
      {(captain || player.isCaptain || player.isViceCaptain) && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
            ${(captain === 'C' || player.isCaptain)
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' 
              : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
            }
          `}>
            {captain || (player.isCaptain ? 'C' : 'VC')}
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Position Badge */}
            <span className={`
              px-2 py-1 rounded-md text-xs font-bold border
              ${getPositionColor(player.position)}
            `}>
              {player.position}
            </span>
            
            {/* Region Flag */}
            <span className="text-lg">{getRegionFlag(player.region)}</span>
          </div>

          {/* Overall Rating */}
          <div className={`
            w-12 h-12 rounded-xl bg-gradient-to-br ${getOverallColor(player.overall)}
            flex items-center justify-center font-bold text-white text-sm shadow-lg
          `}>
            {player.overall}
          </div>
        </div>

        {/* Player Name */}
        <h3 className={`
          font-bold text-white mb-1 group-hover:text-tsw-blue transition-colors
          ${compact ? 'text-sm' : 'text-base'}
        `}>
          {player.name}
        </h3>

        {/* Club */}
        <p className={`text-gray-400 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          {player.club}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {/* Form */}
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Form:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`
                      w-3 h-3 
                      ${i < Math.floor(player.form / 2) 
                        ? 'text-yellow-400' 
                        : 'text-gray-600'
                      }
                    `}
                  />
                ))}
              </div>
            </div>

            {/* Selection Percentage */}
            <div className="text-gray-400">
              {player.selected}%
            </div>
          </div>

          {/* Price */}
          {showPrice && (
            <div className="font-bold text-tsw-green">
              £{player.price}M
            </div>
          )}
        </div>

        {/* Hover Info */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: player.isSelected ? 1 : 0,
            height: player.isSelected ? 'auto' : 0
          }}
          className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-300"
        >
          <div className="flex justify-between">
            <span>Points: {Math.floor(Math.random() * 50) + 20}</span>
            <span>Goals: {Math.floor(Math.random() * 15)}</span>
          </div>
        </motion.div>

        {/* Selection Indicator */}
        {player.isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-2 right-2"
          >
            <div className="w-6 h-6 bg-tsw-blue rounded-full flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerCard;
