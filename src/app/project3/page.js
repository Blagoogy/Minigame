
'use client'
'use client'
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


// Mock Firebase functions for demo (replace with actual Firebase imports)
const mockDb = {};
const mockAddDoc = async () => ({ id: 'mock' });
const mockGetDocs = async () => ({ forEach: () => {}, docs: [] });
const mockCollection = () => ({});
const mockQuery = () => ({});
const mockOrderBy = () => ({});
const mockLimit = () => ({});

const CursorSurvivalGame = () => {
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [isInvincible, setIsInvincible] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [projectiles, setProjectiles] = useState([]);
  const [borderAttacks, setBorderAttacks] = useState([]);
  const [warningLines, setWarningLines] = useState([]);
  const [difficulty, setDifficulty] = useState(1);
  const gameAreaRef = useRef(null);
  const gameStartTime = useRef(Date.now());
  const gameLoopRef = useRef(null);
  const borderAttackLoopRef = useRef(null);
  const difficultyUpdateRef = useRef(null);
  
  // Handle back button navigation
  const handleBackToHub = () => {
    // Clean up intervals before navigating
    clearInterval(gameLoopRef.current);
    clearInterval(borderAttackLoopRef.current);
    clearInterval(difficultyUpdateRef.current);
    
    // Navigate to hub (in a real app, you'd use Next.js router or similar)
    window.location.href = '/hub';
  };
  
  // Track player cursor position and detect if they leave the game area
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setPlayerPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };
    
    const handleMouseLeave = () => {
      if (!gameOver) {
        setLives(0);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [gameOver]);
  
  // Initialize game on mount
  useEffect(() => {
    loadHighScores();
    startGame();
    
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(borderAttackLoopRef.current);
      clearInterval(difficultyUpdateRef.current);
    };
  }, []);
  
  // Update score timer
  useEffect(() => {
    if (!gameOver) {
      const scoreInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - gameStartTime.current) / 1000);
        setScore(elapsedSeconds);
      }, 1000);
      
      return () => clearInterval(scoreInterval);
    }
  }, [gameOver]);
  
  // Watch for game over condition
  useEffect(() => {
    if (lives <= 0 && !gameOver) {
      endGame();
    }
  }, [lives]);
  
  // Check collisions
  useEffect(() => {
    if (isInvincible || gameOver) return;
    
    const playerSize = 10;
    
    for (const projectile of projectiles) {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - projectile.x, 2) + 
        Math.pow(playerPosition.y - projectile.y, 2)
      );
      
      if (distance < playerSize + projectile.size / 2) {
        handleCollision();
        break;
      }
    }
    
    for (const border of borderAttacks) {
      if (border.type === 'top' && playerPosition.y < border.size) {
        handleCollision();
        break;
      } else if (border.type === 'right' && playerPosition.x > window.innerWidth - border.size) {
        handleCollision();
        break;
      } else if (border.type === 'bottom' && playerPosition.y > window.innerHeight - border.size) {
        handleCollision();
        break;
      } else if (border.type === 'left' && playerPosition.x < border.size) {
        handleCollision();
        break;
      } else if (border.type === 'h-line' && 
                Math.abs(playerPosition.y - border.position) < border.size / 2) {
        handleCollision();
        break;
      } else if (border.type === 'v-line' && 
                Math.abs(playerPosition.x - border.position) < border.size / 2) {
        handleCollision();
        break;
      }
    }
  }, [playerPosition, projectiles, borderAttacks, isInvincible, gameOver]);
  
  const startGame = () => {
    gameStartTime.current = Date.now();
    
    const updateGameLoop = () => {
      clearInterval(gameLoopRef.current);
      const interval = Math.max(100, 800 - (difficulty * 70));
      gameLoopRef.current = setInterval(() => {
        createProjectile();
      }, interval);
    };
    
    updateGameLoop();
    
    const updateBorderLoop = () => {
      clearInterval(borderAttackLoopRef.current);
      const interval = Math.max(500, 2000 - (difficulty * 150));
      borderAttackLoopRef.current = setInterval(() => {
        if (Math.random() > 0.5) {
          createBorderAttack();
        }
      }, interval);
    };
    
    updateBorderLoop();
    
    difficultyUpdateRef.current = setInterval(() => {
      setDifficulty(prev => {
        const newDifficulty = prev + 0.5;
        updateGameLoop();
        updateBorderLoop();
        return newDifficulty;
      });
    }, 15000);
  };
  
  const endGame = async () => {
    setGameOver(true);
    clearInterval(gameLoopRef.current);
    clearInterval(borderAttackLoopRef.current);
    clearInterval(difficultyUpdateRef.current);
    
    try {
      await mockAddDoc().catch(error => {
        console.error("Error saving high score:", error);
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Error saving high score:", error);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };
  
  const loadHighScores = async () => {
    try {
      const querySnapshot = await mockGetDocs().catch(error => {
        console.error("Error fetching high scores:", error);
        return { docs: [] };
      });
      
      const scores = [];
      querySnapshot.forEach((doc) => {
        scores.push(doc.data());
      });
      
      setHighScores(scores);
    } catch (error) {
      console.error("Error loading high scores:", error);
      setHighScores([]);
    }
  };
  
  const handleCollision = () => {
    if (isInvincible) return;
    
    setLives(prev => prev - 1);
    setIsInvincible(true);
    
    setTimeout(() => {
      setIsInvincible(false);
    }, 3000);
  };
  
  const createProjectile = () => {
    const side = Math.floor(Math.random() * 4);
    
    let x, y, xSpeed, ySpeed;
    const baseSpeed = 2 + (difficulty * 0.8);
    const speed = Math.random() * 3 + baseSpeed;
    
    if (side === 0) {
      x = Math.random() * window.innerWidth;
      y = 0;
      xSpeed = Math.random() * 2 - 1;
      ySpeed = Math.random() * speed + 1;
    } else if (side === 1) {
      x = window.innerWidth;
      y = Math.random() * window.innerHeight;
      xSpeed = -(Math.random() * speed + 1);
      ySpeed = Math.random() * 2 - 1;
    } else if (side === 2) {
      x = Math.random() * window.innerWidth;
      y = window.innerHeight;
      xSpeed = Math.random() * 2 - 1;
      ySpeed = -(Math.random() * speed + 1);
    } else {
      x = 0;
      y = Math.random() * window.innerHeight;
      xSpeed = Math.random() * speed + 1;
      ySpeed = Math.random() * 2 - 1;
    }
    
    const newProjectile = {
      id: Date.now() + Math.random(),
      x,
      y,
      xSpeed,
      ySpeed,
      size: Math.random() * 15 + 10,
    };
    
    setProjectiles(prev => [...prev, newProjectile]);
    
    const removeTime = Math.max(2000, 5000 - (difficulty * 300));
    setTimeout(() => {
      setProjectiles(prev => prev.filter(p => p.id !== newProjectile.id));
    }, removeTime);
  };
  
  const createBorderAttack = () => {
    const types = ['top', 'right', 'bottom', 'left', 'h-line', 'v-line', 'h-line', 'v-line'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let size, position;
    
    if (type === 'h-line' || type === 'v-line') {
      size = Math.floor(Math.random() * 20) + 10;
      
      if (type === 'h-line') {
        position = Math.floor(Math.random() * (window.innerHeight - 100)) + 50;
      } else {
        position = Math.floor(Math.random() * (window.innerWidth - 100)) + 50;
      }
      
      createWarningLine(type, position, size);
    } else {
      size = Math.floor(Math.random() * 50) + 50;
      position = null;
    }
    
    if (type === 'h-line' || type === 'v-line') {
      const warningTime = Math.max(500, 1000 - (difficulty * 50));
      
      setTimeout(() => {
        const newBorderAttack = {
          id: Date.now() + Math.random(),
          type,
          size,
          position
        };
        
        setBorderAttacks(prev => [...prev, newBorderAttack]);
        
        const duration = Math.max(1000, 2000 - (difficulty * 100));
        setTimeout(() => {
          setBorderAttacks(prev => prev.filter(b => b.id !== newBorderAttack.id));
        }, duration);
      }, warningTime);
    } else {
      const newBorderAttack = {
        id: Date.now() + Math.random(),
        type,
        size,
        position
      };
      
      setBorderAttacks(prev => [...prev, newBorderAttack]);
      
      const duration = Math.max(1000, 2000 - (difficulty * 100));
      setTimeout(() => {
        setBorderAttacks(prev => prev.filter(b => b.id !== newBorderAttack.id));
      }, duration);
    }
  };
  
  const createWarningLine = (type, position, size) => {
    const warningId = Date.now() + Math.random();
    
    const newWarningLine = {
      id: warningId,
      type,
      position,
      size: size * 0.8
    };
    
    setWarningLines(prev => [...prev, newWarningLine]);
    
    const warningTime = Math.max(500, 1000 - (difficulty * 50));
    
    setTimeout(() => {
      setWarningLines(prev => prev.filter(w => w.id !== warningId));
    }, warningTime);
  };
  
  // Update projectile positions
  useEffect(() => {
    if (gameOver) return;
    
    const moveInterval = setInterval(() => {
      setProjectiles(prev => 
        prev.map(projectile => ({
          ...projectile,
          x: projectile.x + projectile.xSpeed,
          y: projectile.y + projectile.ySpeed
        }))
      );
    }, 16);
    
    return () => clearInterval(moveInterval);
  }, [gameOver]);
  
  const difficultyLevel = Math.floor(difficulty);
  const difficultyText = difficultyLevel === 1 ? "Easy" : 
                         difficultyLevel <= 3 ? "Medium" : 
                         difficultyLevel <= 5 ? "Hard" : "Extreme";
  
  return (
    <div className="w-full h-screen bg-gray-900 text-white overflow-hidden relative" ref={gameAreaRef}>
      {/* Back Button */}
      <button
        onClick={handleBackToHub}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 text-white font-medium shadow-lg"
      >
        ← Back to Hub
      </button>
      
      {/* Game UI - moved right to avoid overlap with back button */}
      <div className="absolute top-4 left-48 flex gap-4 z-10">
        <div className="px-4 py-2 bg-gray-800 rounded-md">
          Lives: {Array(lives).fill('❤️').join(' ')}
        </div>
        <div className="px-4 py-2 bg-gray-800 rounded-md">
          Score: {score}
        </div>
        <div className={`px-4 py-2 rounded-md ${
          difficultyLevel <= 1 ? 'bg-green-800' : 
          difficultyLevel <= 3 ? 'bg-yellow-800' : 
          difficultyLevel <= 5 ? 'bg-orange-800' : 'bg-red-800'
        }`}>
          Level: {difficultyText}
        </div>
      </div>
      
      {/* High scores */}
      <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-md z-10">
        <h3 className="text-lg font-bold mb-2">High Scores</h3>
        {highScores.length > 0 ? (
          <ul>
            {highScores.map((score, index) => (
              <li key={index} className="flex justify-between">
                <span>#{index + 1}</span>
                <span className="ml-4">{score.score} sec</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No high scores yet</p>
        )}
      </div>
      
      {/* Player cursor */}
      <div 
        className={`absolute w-2 h-2 rounded-full ${isInvincible ? 'bg-blue-500 animate-pulse' : 'bg-transparent'}`} 
        style={{ 
          left: playerPosition.x - 1, 
          top: playerPosition.y - 1,
          boxShadow: isInvincible ? '0 0 15px 5px rgba(59, 130, 246, 0.7)' : 'none'
        }}
      />
      
      {/* Warning Lines */}
      <AnimatePresence>
        {warningLines.map(warning => {
          let styles = {};
          
          if (warning.type === 'h-line') {
            styles = { 
              top: warning.position - warning.size / 2, 
              left: 0, 
              width: '100%', 
              height: warning.size 
            };
          } else if (warning.type === 'v-line') {
            styles = { 
              top: 0, 
              left: warning.position - warning.size / 2, 
              width: warning.size, 
              height: '100%' 
            };
          }
          
          return (
            <motion.div
              key={warning.id}
              className="absolute bg-yellow-500"
              style={styles}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          );
        })}
      </AnimatePresence>
      
      {/* Projectiles */}
      <AnimatePresence>
        {projectiles.map(projectile => (
          <motion.div
            key={projectile.id}
            className="absolute bg-red-500 rounded-full"
            style={{
              width: projectile.size,
              height: projectile.size,
              left: projectile.x - projectile.size / 2,
              top: projectile.y - projectile.size / 2
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          />
        ))}
      </AnimatePresence>
      
      {/* Border Attacks */}
      <AnimatePresence>
        {borderAttacks.map(border => {
          let styles = {};
          
          if (border.type === 'top') {
            styles = { top: 0, left: 0, width: '100%', height: border.size };
          } else if (border.type === 'right') {
            styles = { top: 0, right: 0, width: border.size, height: '100%' };
          } else if (border.type === 'bottom') {
            styles = { bottom: 0, left: 0, width: '100%', height: border.size };
          } else if (border.type === 'left') {
            styles = { top: 0, left: 0, width: border.size, height: '100%' };
          } else if (border.type === 'h-line') {
            styles = { 
              top: border.position - border.size / 2, 
              left: 0, 
              width: '100%', 
              height: border.size 
            };
          } else if (border.type === 'v-line') {
            styles = { 
              top: 0, 
              left: border.position - border.size / 2, 
              width: border.size, 
              height: '100%' 
            };
          }
          
          return (
            <motion.div
              key={border.id}
              className="absolute bg-red-600"
              style={styles}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </AnimatePresence>
      
      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-30">
          <h2 className="text-4xl font-bold mb-4">Game Over</h2>
          <p className="text-2xl">Your score: {score} seconds</p>
          {lives === 0 && playerPosition.x === 0 && playerPosition.y === 0 && (
            <p className="text-xl text-red-500 mt-2">Busted for cheating! Keep your cursor in the game area.</p>
          )}
          <p className="mt-4">Reloading in 3 seconds...</p>
          <button
            onClick={handleBackToHub}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            ← Return to Hub Now
          </button>
        </div>
      )}
      
      {/* Instructions */}
      {!gameOver && score < 5 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-80 p-4 rounded-lg text-center">
          <p>Move your cursor to avoid the red obstacles!</p>
          <p>Watch out for red balls AND red lines appearing anywhere on screen!</p>
          <p><span className="text-yellow-400">Yellow warning lines</span> will appear before the red lines - move away quickly!</p>
          <p>You have 3 lives. Good luck!</p>
          <p className="text-red-400 text-sm mt-1">Warning: Leaving the game area will result in an automatic loss!</p>
        </div>
      )}
    </div>
  );
};

export default CursorSurvivalGame;