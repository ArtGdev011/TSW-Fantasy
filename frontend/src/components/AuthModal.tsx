import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { XMarkIcon, ShieldCheckIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lockCountdown, setLockCountdown] = useState(59 * 60 + 12); // 59:12 minutes
  
  const { login, signup } = useAuth();

  // Countdown timer for urgency
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setLockCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      let success = false;
      
      if (isLogin) {
        success = await login(formData.username, formData.password);
      } else {
        if (!formData.username || !formData.password) {
          setErrors({ form: 'Username and password are required' });
          setIsLoading(false);
          return;
        }
        success = await signup(formData.username, formData.password, formData.email, formData.firstName, formData.lastName);
      }

      if (success) {
        onClose();
      } else {
        setErrors({ form: isLogin ? 'Invalid credentials' : 'Signup failed. Try again.' });
      }
    } catch (error) {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const socialProofMessages = [
    "Top player this week: CyberKnight with 342 pts",
    "€2,500 in prizes awarded last month",
    "Join 15,000+ competitive players",
    "Average team value increased 23% this season"
  ];

  const [currentProof, setCurrentProof] = useState(0);

  useEffect(() => {
    const proofTimer = setInterval(() => {
      setCurrentProof(prev => (prev + 1) % socialProofMessages.length);
    }, 3000);
    return () => clearInterval(proofTimer);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => {}} // Prevent closing by clicking outside
          open={isOpen}
        >
          <div className="flex min-h-screen items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray p-8 shadow-2xl border border-tsw-blue/20"
            >
              {/* Close button - only show for existing users */}
              {isLogin && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-4"
                >
                  <h1 className="text-4xl font-gaming font-bold bg-gradient-to-r from-tsw-blue to-tsw-neon bg-clip-text text-transparent">
                    TSW GURU
                  </h1>
                  <div className="w-20 h-1 bg-gradient-to-r from-tsw-red to-tsw-blue mx-auto mt-2 rounded-full"></div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isLogin ? 'Welcome Back, Guru' : 'Create Your Elite Team'}
                  </h2>
                  <p className="text-gray-300">
                    {isLogin 
                      ? 'Ready to dominate this gameweek?' 
                      : 'Build your squad in 30 seconds. No OAuth—just username & password.'
                    }
                  </p>
                </motion.div>
              </div>

              {/* Urgency Timer */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="bg-gradient-to-r from-tsw-red/20 to-tsw-blue/20 border border-tsw-red/30 rounded-2xl p-4 mb-6 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-tsw-red mb-1">
                  <ClockIcon className="h-5 w-5 animate-pulse" />
                  <span className="font-bold text-lg font-mono">{formatTime(lockCountdown)}</span>
                </div>
                <p className="text-sm text-gray-300">until team locks for next gameweek</p>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                key={currentProof}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-tsw-gray/50 border border-tsw-blue/20 rounded-xl p-3 mb-6 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-tsw-blue">
                  <TrophyIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{socialProofMessages[currentProof]}</span>
                </div>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 bg-tsw-gray border border-tsw-blue/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tsw-blue focus:border-transparent transition-all"
                    placeholder="Your gaming handle"
                    disabled={isLoading}
                  />
                </div>

                {/* Email (signup only) */}
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-3 bg-tsw-gray border border-tsw-blue/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tsw-blue focus:border-transparent transition-all"
                          placeholder="John"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-3 bg-tsw-gray border border-tsw-blue/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tsw-blue focus:border-transparent transition-all"
                          placeholder="Doe"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email <span className="text-gray-500">(optional, for prize notifications)</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-tsw-gray border border-tsw-blue/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tsw-blue focus:border-transparent transition-all"
                        placeholder="your@email.com"
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 bg-tsw-gray border border-tsw-blue/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tsw-blue focus:border-transparent transition-all"
                    placeholder="Secure password"
                    disabled={isLoading}
                  />
                </div>

                {/* Error Message */}
                {errors.form && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-tsw-red/20 border border-tsw-red/50 rounded-xl p-3 text-tsw-red text-sm text-center"
                  >
                    {errors.form}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-tsw-blue to-tsw-red hover:from-tsw-blue-glow hover:to-tsw-red-glow disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-tsw-blue/25"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {isLogin ? 'Signing In...' : 'Creating Team...'}
                    </div>
                  ) : (
                    isLogin ? 'Enter the Arena' : 'Start Dominating'
                  )}
                </motion.button>
              </form>

              {/* Toggle Login/Signup */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-tsw-blue hover:text-tsw-neon transition-colors font-medium"
                >
                  {isLogin ? "New here? Create your team →" : "Already have an account? Sign in →"}
                </button>
              </div>

              {/* Trust Signals */}
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <ShieldCheckIcon className="h-4 w-4 text-tsw-green" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrophyIcon className="h-4 w-4 text-tsw-yellow" />
                  <span>Weekly Prizes</span>
                </div>
              </div>

              {/* Progress Indicator for new users */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 bg-tsw-gray/30 rounded-full p-1"
                >
                  <div className="flex items-center text-xs text-gray-400">
                    <div className="bg-tsw-blue rounded-full w-2 h-2 mr-2"></div>
                    <span>Step 1 of 2: Create Account</span>
                    <div className="ml-auto text-tsw-blue font-medium">Next: Build Team</div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
