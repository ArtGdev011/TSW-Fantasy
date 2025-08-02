import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Star, DollarSign } from 'lucide-react';
import api from '../services/api';
import './Market.css';

interface Player {
  _id: string;
  name: string;
  position: string;
  club: string;
  price: number;
  totalPoints: number;
  form: number;
  selected: number;
  priceChange: number;
}

const Market: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [sortBy, setSortBy] = useState('totalPoints');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const positions = ['all', 'GK', 'CDM', 'LW', 'RW'];

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    filterAndSortPlayers();
  }, [players, searchTerm, selectedPosition, sortBy, sortOrder, minPrice, maxPrice]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPlayers = () => {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.club.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Position filter
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(player => player.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(player => player.price <= parseFloat(maxPrice));
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Player];
      const bValue = b[sortBy as keyof Player];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredPlayers(filtered);
  };

  const handleTransfer = async (playerId: string) => {
    try {
      // This would typically open a transfer modal or handle the transfer logic
      console.log('Transfer player:', playerId);
      // await api.post('/teams/transfer', { playerId });
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={14} className="price-up" />;
    if (change < 0) return <TrendingDown size={14} className="price-down" />;
    return null;
  };

  const getFormClass = (form: number) => {
    if (form >= 8) return 'form-excellent';
    if (form >= 6) return 'form-good';
    if (form >= 4) return 'form-average';
    return 'form-poor';
  };

  if (loading) {
    return (
      <div className="market-loading">
        <div className="loading-spinner"></div>
        <p>Loading player market...</p>
      </div>
    );
  }

  return (
    <div className="market">
      <div className="market-header">
        <h1>Transfer Market</h1>
        <p>Browse and transfer players to build your ultimate team</p>
      </div>

      {/* Filters */}
      <div className="market-filters">
        <div className="search-section">
          <div className="search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search players or clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Position</label>
            <select 
              value={selectedPosition} 
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>
                  {pos === 'all' ? 'All Positions' : pos}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Min Price</label>
            <input
              type="number"
              step="0.1"
              placeholder="0.0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Max Price</label>
            <input
              type="number"
              step="0.1"
              placeholder="15.0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="totalPoints">Total Points</option>
              <option value="price">Price</option>
              <option value="form">Form</option>
              <option value="selected">Selected %</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order</label>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>Showing {filteredPlayers.length} of {players.length} players</p>
      </div>

      {/* Players Table */}
      <div className="players-table-container">
        <table className="players-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Position</th>
              <th>Club</th>
              <th>Price</th>
              <th>Points</th>
              <th>Form</th>
              <th>Selected</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => (
              <tr key={player._id}>
                <td className="player-cell">
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    {player.priceChange !== 0 && (
                      <div className="price-change">
                        {getPriceChangeIcon(player.priceChange)}
                        <span>£{Math.abs(player.priceChange)}m</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`position-badge position-${player.position.toLowerCase()}`}>
                    {player.position}
                  </span>
                </td>
                <td className="club-cell">{player.club}</td>
                <td className="price-cell">
                  <DollarSign size={14} />
                  £{player.price}m
                </td>
                <td className="points-cell">{player.totalPoints}</td>
                <td>
                  <span className={`form-badge ${getFormClass(player.form)}`}>
                    {player.form.toFixed(1)}
                  </span>
                </td>
                <td className="selected-cell">{player.selected}%</td>
                <td>
                  <button 
                    className="transfer-btn"
                    onClick={() => handleTransfer(player._id)}
                  >
                    Transfer In
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPlayers.length === 0 && (
        <div className="no-results">
          <Filter size={48} />
          <h3>No players found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
};

export default Market;
