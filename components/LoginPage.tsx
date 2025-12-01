import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[]; // Pass the actual list of users
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Normalize email to prevent "Pedro" vs "pedro" database mismatch
    const normalizedEmail = email.toLowerCase().trim();

    // Simulated network delay
    setTimeout(() => {
      // Find matching user in the database
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);

      if (user) {
        // Pass the normalized user object up
        onLogin({ ...user, email: normalizedEmail });
      } else {
        setError('Invalid credentials. The gatekeeper does not recognize you.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-serif font-bold text-ink-900 dark:text-stone-100 mb-2">Beyond Words</h1>
          <p className="text-stone-500 font-serif italic">Where thoughts become timeless.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 shadow-2xl rounded-lg p-8 relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-paper-200 dark:bg-stone-800 -mr-8 -mt-8 rotate-45"></div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 font-serif">
                Access Key (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-3 text-ink-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 outline-none transition-all font-serif"
                placeholder="writer@beyond-views.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 font-serif">
                Secret (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-3 text-ink-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 outline-none transition-all font-serif"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm font-serif flex items-center gap-2">
                <Lock size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900 font-bold py-3 px-4 rounded hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? 'Unlocking...' : 'Enter Study'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-stone-400 text-xs font-serif">
          &copy; {new Date().getFullYear()} Beyond Views Publishing.
        </div>
      </div>
    </div>
  );
};