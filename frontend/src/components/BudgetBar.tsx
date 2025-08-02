import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface BudgetBarProps {
  totalBudget: number;
  spent: number;
  remaining: number;
}

const BudgetBar: React.FC<BudgetBarProps> = ({ totalBudget, spent, remaining }) => {
  const spentPercentage = (spent / totalBudget) * 100;
  const isOverBudget = remaining < 0;
  const isLowBudget = remaining <= totalBudget * 0.1 && remaining >= 0;

  return (
    <div className="mb-8">
      <div className="max-w-4xl mx-auto bg-tsw-dark rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-tsw-blue/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-tsw-blue" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Transfer Budget</h3>
              <p className="text-gray-400 text-sm">Manage your team finances</p>
            </div>
          </div>
          
          {isOverBudget && (
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Over Budget!</span>
            </div>
          )}
          
          {isLowBudget && !isOverBudget && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Low Budget</span>
            </div>
          )}
        </div>

        {/* Budget Bar */}
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : isLowBudget
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-tsw-blue to-blue-500'
              }`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
            {isOverBudget && (
              <div 
                className="absolute top-0 h-full bg-red-600/50 animate-pulse"
                style={{ 
                  left: '100%', 
                  width: `${((spent - totalBudget) / totalBudget) * 100}%`,
                  transform: 'translateX(-100%)'
                }}
              />
            )}
          </div>
          
          {/* Budget markers */}
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-400">0M</span>
            <span className="text-gray-400">{totalBudget / 2}M</span>
            <span className="text-gray-400">{totalBudget}M</span>
          </div>
        </div>

        {/* Budget Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-gray-800 rounded-xl">
            <div className="text-2xl font-bold text-white mb-1">{totalBudget}M</div>
            <div className="text-gray-400 text-sm">Total Budget</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800 rounded-xl">
            <div className={`text-2xl font-bold mb-1 ${
              isOverBudget ? 'text-red-400' : 'text-white'
            }`}>
              {spent}M
            </div>
            <div className="text-gray-400 text-sm">Spent</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800 rounded-xl">
            <div className={`text-2xl font-bold mb-1 ${
              isOverBudget 
                ? 'text-red-400' 
                : isLowBudget 
                ? 'text-yellow-400' 
                : 'text-green-400'
            }`}>
              {remaining}M
            </div>
            <div className="text-gray-400 text-sm">Remaining</div>
          </div>
        </div>

        {/* Budget Status Message */}
        {isOverBudget && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                You are {Math.abs(remaining)}M over budget. Remove some players to continue.
              </span>
            </div>
          </div>
        )}
        
        {isLowBudget && !isOverBudget && (
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                Budget running low! Only {remaining}M remaining for transfers.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetBar;
