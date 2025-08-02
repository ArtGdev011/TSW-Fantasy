import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import PlayerCard, { Player } from './PlayerCard';

// Sample player data for demo
const SAMPLE_PLAYERS: Player[] = [
  { id: '1', name: 'M. Salah', position: 'RW', overall: 90, price: 13.0, region: 'Egypt', club: 'Liverpool', form: 9, selected: 45 },
  { id: '2', name: 'K. De Bruyne', position: 'CDM', overall: 91, price: 12.5, region: 'Belgium', club: 'Man City', form: 8, selected: 38 },
  { id: '3', name: 'E. Haaland', position: 'RW', overall: 88, price: 11.5, region: 'Norway', club: 'Man City', form: 10, selected: 52 },
  { id: '4', name: 'Alisson', position: 'GK', overall: 89, price: 6.0, region: 'Brazil', club: 'Liverpool', form: 7, selected: 25 },
  { id: '5', name: 'Vinicius Jr.', position: 'LW', overall: 86, price: 10.5, region: 'Brazil', club: 'Real Madrid', form: 9, selected: 35 },
  { id: '6', name: 'L. Modric', position: 'CDM', overall: 88, price: 8.5, region: 'Croatia', club: 'Real Madrid', form: 8, selected: 22 },
  { id: '7', name: 'Courtois', position: 'GK', overall: 87, price: 5.5, region: 'Belgium', club: 'Real Madrid', form: 6, selected: 18 },
  { id: '8', name: 'Mbappe', position: 'LW', overall: 92, price: 12.0, region: 'France', club: 'PSG', form: 10, selected: 48 },
  { id: '9', name: 'Pedri', position: 'CDM', overall: 85, price: 7.5, region: 'Spain', club: 'Barcelona', form: 7, selected: 28 },
  { id: '10', name: 'R. Mahrez', position: 'RW', overall: 86, price: 9.0, region: 'Algeria', club: 'Al Ahli', form: 8, selected: 15 },
];

interface MarketProps {
  selectedPlayers: Player[];
  onPlayerSelect: (player: Player) => void;
  budget: number;
  maxBudget: number;
  className?: string;
}

const Market: React.FC<MarketProps> = ({
  selectedPlayers,
  onPlayerSelect,
  budget,
  maxBudget,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15]);
  const [sortBy, setSortBy] = useState<'overall' | 'price' | 'form' | 'selected'>('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const positions = ['all', 'GK', 'CDM', 'LW', 'RW'];
  const regions = ['all', 'England', 'Spain', 'Germany', 'France', 'Brazil', 'Argentina'];

  // Smart recommendations based on team needs
  const getTeamNeeds = useMemo(() => {
    const positionCounts = {
      GK: selectedPlayers.filter(p => p.position === 'GK').length,
      CDM: selectedPlayers.filter(p => p.position === 'CDM').length,
      LW: selectedPlayers.filter(p => p.position === 'LW').length,
      RW: selectedPlayers.filter(p => p.position === 'RW').length
    };

    const needs = [];
    if (positionCounts.GK < 1) needs.push('GK');
    if (positionCounts.CDM < 2) needs.push('CDM');
    if (positionCounts.LW < 1) needs.push('LW');
    if (positionCounts.RW < 1) needs.push('RW');

    return needs;
  }, [selectedPlayers]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = SAMPLE_PLAYERS.filter(player => {
      // Search filter
      if (searchTerm && !player.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !player.club.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Position filter
      if (selectedPosition !== 'all' && player.position !== selectedPosition) {
        return false;
      }

      // Price filter
      if (player.price < priceRange[0] || player.price > priceRange[1]) {
        return false;
      }

      // Budget filter - can afford the player
      const remainingBudget = maxBudget - selectedPlayers.reduce((sum, p) => sum + p.price, 0);
      if (player.price > remainingBudget && !selectedPlayers.find(p => p.id === player.id)) {
        return false;
      }

      return true;
    });

    // Sort players
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [searchTerm, selectedPosition, priceRange, sortBy, sortOrder, selectedPlayers, maxBudget]);

  // Smart player recommendations
  const getRecommendations = () => {
    if (getTeamNeeds.length === 0) return [];
    
    const needPosition = getTeamNeeds[0];
    return SAMPLE_PLAYERS
      .filter(p => p.position === needPosition)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 3);
  };

  const recommendations = getRecommendations();

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Transfer Market</h2>
          <p className="text-gray-400">Build your ultimate squad</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-tsw-gray border border-tsw-blue/30 rounded-xl text-white hover:border-tsw-blue transition-colors"
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
        </motion.button>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-tsw-blue/10 to-tsw-red/10 border border-tsw-blue/20 rounded-2xl"
        >
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-tsw-blue" />
            Smart Picks for {getTeamNeeds[0]}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map(player => (
              <PlayerCard
                key={player.id}
                player={{
                  ...player,
                  isSelected: selectedPlayers.some(p => p.id === player.id)
                }}
                onSelect={onPlayerSelect}
                compact
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Search and Quick Filters */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search players or clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-tsw-gray border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tsw-blue focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-3 bg-tsw-gray border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-tsw-blue"
          >
            <option value="overall-desc">Highest Rated</option>
            <option value="price-asc">Cheapest</option>
            <option value="price-desc">Most Expensive</option>
            <option value="form-desc">Best Form</option>
            <option value="selected-desc">Most Selected</option>
          </select>
        </div>

        {/* Position Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {positions.map(position => (
            <motion.button
              key={position}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPosition(position)}
              className={`
                px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all
                ${selectedPosition === position
                  ? 'bg-tsw-blue text-white'
                  : 'bg-tsw-gray text-gray-300 hover:bg-tsw-blue/20'
                }
                ${getTeamNeeds.includes(position) ? 'ring-2 ring-tsw-red/50' : ''}
              `}
            >
              {position === 'all' ? 'All Positions' : position}
              {getTeamNeeds.includes(position) && (
                <span className="ml-1 text-tsw-red text-xs">•</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-tsw-gray/30 border border-gray-600 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Advanced Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price Range: £{priceRange[0]}M - £{priceRange[1]}M
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredPlayers.map(player => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <PlayerCard
                player={{
                  ...player,
                  isSelected: selectedPlayers.some(p => p.id === player.id)
                }}
                onSelect={onPlayerSelect}
                disabled={
                  selectedPlayers.length >= 5 && 
                  !selectedPlayers.some(p => p.id === player.id)
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* No Results */}
      {filteredPlayers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedPosition('all');
              setPriceRange([0, 15]);
            }}
            className="px-6 py-3 bg-tsw-blue hover:bg-tsw-blue-glow text-white rounded-xl font-medium transition-colors"
          >
            Clear Filters
          </button>
        </motion.div>
      )}

      {/* Results Count */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        Showing {filteredPlayers.length} of {SAMPLE_PLAYERS.length} players
      </div>
    </div>
  );
};

export default Market;
