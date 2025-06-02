'use client'
'use client'
import { useState, useEffect } from 'react';

const MinigameHub = () => {
  const [hoveredGame, setHoveredGame] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const games = [
    {
      id: 1,
      title: "Cursor Survival",
      description: "Dodge projectiles and survive as long as you can with just your cursor!",
      color: "from-red-500 to-pink-600",
      glowColor: "red",
      action: () => {
        window.location.href = '/project3';
      }
    },
    {
      id: 2,
      title: "Tower Defense",
      description: "Build towers and defend your base against waves of enemies!",
      color: "from-blue-500 to-cyan-600",
      glowColor: "blue",
      action: () => {
        window.location.href = '/tower';
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          />
        ))}
      </div>

      {/* Cursor trail effect */}
      <div
        className="absolute w-6 h-6 rounded-full pointer-events-none z-50 transition-all duration-100"
        style={{
          background: `radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, transparent 70%)`,
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
      />

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-6 hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 text-yellow-400 mr-4 text-4xl">👑</div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              ARCADE HUB
            </h1>
            <div className="w-12 h-12 text-yellow-400 ml-4 text-4xl">👑</div>
          </div>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto opacity-0 animate-fade-in-delay-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="relative group cursor-pointer w-full transform transition-all duration-300 hover:scale-102"
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              onClick={game.action}
            >
              {/* Glow effect */}
              <div
                className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 ${
                  hoveredGame === game.id ? 'opacity-40' : 'opacity-0'
                }`}
                style={{
                  background: game.id === 1 
                    ? `linear-gradient(135deg, #ef4444, #ec4899)`
                    : `linear-gradient(135deg, #3b82f6, #06b6d4)`,
                }}
              />

              {/* Main card */}
              <div className={`relative bg-gradient-to-br ${game.color} p-1 rounded-2xl`}>
                <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-8 h-full">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center transform transition-all duration-300 hover:scale-110 hover:rotate-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg`}>
                      <div className="text-white text-4xl">
                        {game.id === 1 ? '🎯' : '🏰'}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-6 text-center">
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-3">{game.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{game.description}</p>
                    </div>

                    {/* Play button */}
                    <button
                      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r ${game.color} text-white hover:shadow-lg transform hover:scale-102 active:scale-98`}
                    >
                      <span className="flex items-center justify-center">
                        <span className="text-2xl mr-2">🎮</span>
                        Play Now
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hover particles */}
              {hoveredGame === game.id && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${game.color} animate-float`}
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 opacity-0 animate-fade-in-delay-4">
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(0); opacity: 0; }
          50% { transform: translateY(-40px) scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.5s forwards;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.8s ease-out 0.8s forwards;
        }
        
        .animate-fade-in-delay-3 {
          animation: fade-in 0.8s ease-out 1.2s forwards;
        }
        
        .animate-fade-in-delay-4 {
          animation: fade-in 0.8s ease-out 2s forwards;
        }
        
        .animate-float {
          animation: float 2s infinite;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

export default MinigameHub;