'use client';

import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signInWithGoogle, loading, authError } = useAuth();

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative overflow-hidden neon-border text-center">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]"></div>

      <div className="mb-8 relative">
        <div className="w-20 h-20 mx-auto bg-[var(--neon-cyan)] rounded-xl flex items-center justify-center shadow-[0_0_20px_var(--neon-cyan)] mb-4 rotate-3 hover:rotate-6 transition-transform duration-300">
          <span className="text-black font-bold text-4xl font-['Orbitron']">M</span>
        </div>
        <h1 className="text-3xl font-bold tracking-widest text-white mb-2">
          MEMORY<span className="text-[var(--neon-pink)] neon-text-pink">PROTOCOL</span>
        </h1>
        <p className="text-gray-400 text-sm uppercase tracking-wider">Secure Access Required</p>
      </div>

      <div className="space-y-6">
        <p className="text-gray-300 font-light">
          Authenticate to access the neural network and challenge other operatives.
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center justify-center gap-3 bg-white text-black py-3 px-6 rounded-lg hover:bg-[var(--neon-cyan)] hover:shadow-[0_0_20px_var(--neon-cyan)] w-full font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
            </g>
          </svg>
          {loading ? 'AUTHENTICATING...' : 'INITIATE LOGIN'}
        </button>

        {authError && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-200 text-xs font-mono animate-pulse">
            ERROR: {authError}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-3 gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[var(--neon-cyan)] text-lg">⚡</span>
          <span>Real-time</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[var(--neon-pink)] text-lg">🏆</span>
          <span>Ranked</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[var(--neon-green)] text-lg">🎲</span>
          <span>3D Assets</span>
        </div>
      </div>
    </div>
  );
}