import React from 'react';
import { Player as APIPlayer } from '../services/api';
import PlayerCard, { Player as CardPlayer } from './PlayerCard';

interface FootballFieldProps {
  players: {
    gk: APIPlayer | null;
    cdm1: APIPlayer | null;
    cdm2: APIPlayer | null;
    lw: APIPlayer | null;
    rw: APIPlayer | null;
  };
  substitutes: {
    sub1: APIPlayer | null;
    sub2: APIPlayer | null;
    sub3: APIPlayer | null;
  };
  captain: APIPlayer | null;
  viceCaptain: APIPlayer | null;
  onPlayerRemove: (position: string) => void;
  onDrop: (position: string, player: APIPlayer) => void;
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

const FootballField: React.FC<FootballFieldProps> = ({
  players,
  substitutes,
  captain,
  viceCaptain,
  onPlayerRemove,
  onDrop
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, position: string) => {
    e.preventDefault();
    const playerData = e.dataTransfer.getData('text/plain');
    if (playerData) {
      try {
        const player = JSON.parse(playerData);
        onDrop(position, player);
      } catch (error) {
        console.error('Error parsing dropped player data:', error);
      }
    }
  };

  const renderPlayerSlot = (
    player: APIPlayer | null,
    position: string,
    label: string,
    className: string = ""
  ) => (
    <div
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, position)}
    >
      {player ? (
        <div className="relative group">
          <PlayerCard
            player={convertPlayerForCard(player)}
            isSelected={true}
            onSelect={() => {}}
            showPrice={false}
            compact={true}
            captain={
              captain?._id === player._id ? 'C' :
              viceCaptain?._id === player._id ? 'VC' : undefined
            }
          />
          <button
            onClick={() => onPlayerRemove(position)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="h-24 w-20 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center hover:border-tsw-blue/50 hover:bg-gray-700/50 transition-all duration-200">
          <div className="text-xs text-gray-500 font-medium">{label}</div>
          <div className="text-xs text-gray-600 mt-1">Drop Here</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-green-900/20 via-green-800/30 to-green-900/20 rounded-3xl p-8 border border-green-700/30 relative overflow-hidden">
      {/* Field Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full">
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
          
          {/* Goal Areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-16 border-2 border-white border-t-0"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-16 border-2 border-white border-b-0"></div>
          
          {/* Penalty Areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-24 border-2 border-white border-t-0"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-24 border-2 border-white border-b-0"></div>
          
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
        </div>
      </div>

      {/* Formation Layout */}
      <div className="relative z-10 space-y-8">
        {/* Goalkeeper */}
        <div className="flex justify-center pt-4">
          {renderPlayerSlot(players.gk, 'gk', 'GK')}
        </div>

        {/* CDMs */}
        <div className="flex justify-center space-x-16">
          {renderPlayerSlot(players.cdm1, 'cdm1', 'CDM')}
          {renderPlayerSlot(players.cdm2, 'cdm2', 'CDM')}
        </div>

        {/* Wingers */}
        <div className="flex justify-between px-8">
          {renderPlayerSlot(players.lw, 'lw', 'LW')}
          {renderPlayerSlot(players.rw, 'rw', 'RW')}
        </div>

        {/* Formation Label */}
        <div className="text-center pt-4">
          <div className="inline-block bg-green-900/50 px-4 py-2 rounded-full border border-green-600/50">
            <span className="text-white font-semibold text-sm">1-2-2 Formation</span>
          </div>
        </div>
      </div>

      {/* Substitutes Bench */}
      <div className="mt-8 pt-6 border-t border-gray-600/50">
        <h3 className="text-white font-semibold mb-4 text-center">Substitutes Bench</h3>
        <div className="flex justify-center space-x-4">
          {renderPlayerSlot(substitutes.sub1, 'sub1', 'SUB 1')}
          {renderPlayerSlot(substitutes.sub2, 'sub2', 'SUB 2')}
          {renderPlayerSlot(substitutes.sub3, 'sub3', 'SUB 3')}
        </div>
      </div>
    </div>
  );
};

export default FootballField;
