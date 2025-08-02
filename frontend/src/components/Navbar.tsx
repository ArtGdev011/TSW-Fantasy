import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, User, LogOut, Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-tsw-black/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 text-white hover:text-tsw-blue transition-colors duration-200">
            <div className="relative">
              <Trophy className="w-8 h-8 text-tsw-blue animate-pulse-slow" />
              <Zap className="absolute -top-1 -right-1 w-4 h-4 text-tsw-red animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-tsw-blue to-tsw-red bg-clip-text text-transparent">
              TSW Guru
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">
              Dashboard
            </Link>
            <Link to="/team" className="text-gray-300 hover:text-tsw-blue transition-colors duration-200 font-medium">
              My Team
            </Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">
              Leaderboard
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">
                  Dashboard
                </Link>
                <Link to="/team" className="text-gray-300 hover:text-tsw-blue transition-colors duration-200 font-medium">
                  My Team
                </Link>
                <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">
                  Leaderboard
                </Link>
                
                {/* User Menu */}
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-700">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-tsw-blue to-tsw-red flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-tsw-blue to-blue-600 text-white font-medium hover:from-blue-600 hover:to-tsw-blue transition-all duration-200 transform hover:scale-105"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-tsw-dark/95 backdrop-blur-md border-t border-gray-800 animate-slide-up">
          <div className="px-4 py-6 space-y-4">
            <Link 
              to="/dashboard" 
              className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 font-medium"
              onClick={toggleMenu}
            >
              Dashboard
            </Link>
            <Link 
              to="/team" 
              className="block px-4 py-3 rounded-xl text-gray-300 hover:text-tsw-blue hover:bg-gray-800 transition-all duration-200 font-medium"
              onClick={toggleMenu}
            >
              My Team
            </Link>
            <Link 
              to="/leaderboard" 
              className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 font-medium"
              onClick={toggleMenu}
            >
              Leaderboard
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 font-medium"
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/team" 
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:text-tsw-blue hover:bg-gray-800 transition-all duration-200 font-medium"
                  onClick={toggleMenu}
                >
                  My Team
                </Link>
                <Link 
                  to="/market" 
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 font-medium"
                  onClick={toggleMenu}
                >
                  Market
                </Link>
                
                {/* Mobile User Info */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-800/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-tsw-blue to-tsw-red flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-gray-400 text-sm">Logged in</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full mt-3 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 font-medium"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-4 py-3 rounded-xl bg-gradient-to-r from-tsw-blue to-blue-600 text-white font-medium hover:from-blue-600 hover:to-tsw-blue transition-all duration-200 text-center"
                  onClick={toggleMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
