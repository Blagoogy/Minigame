'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TOWER_COST = 50;
const TOWER_RANGE = 80;
const TOWER_DAMAGE = 25;
const UPGRADE_COST = 75;

const TowerDefenseGame = () => {
  const [gameState, setGameState] = useState('playing'); // 'playing', 'gameOver'
  const [currency, setCurrency] = useState(100);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [enemiesReached, setEnemiesReached] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [towers, setTowers] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [wave, setWave] = useState(1);
  const [selectedTower, setSelectedTower] = useState(null);
  const [upgradeMenuPos, setUpgradeMenuPos] = useState({ x: 0, y: 0 });
  
  const gameLoopRef = useRef();
  const lastSpawnRef = useRef(0);
  const currencyTimerRef = useRef(0);
  const scoreRef = useRef(0);

  // Game path (enemies follow this route)
  const path = [
    { x: 0, y: 300 },
    { x: 200, y: 300 },
    { x: 200, y: 150 },
    { x: 400, y: 150 },
    { x: 400, y: 450 },
    { x: 600, y: 450 },
    { x: 600, y: 300 },
    { x: 800, y: 300 }
  ];

  const spawnEnemy = useCallback(() => {
    const enemyTypes = [
      { health: 50, speed: 2, reward: 10, color: 'bg-red-500' },
      { health: 80, speed: 1.5, reward: 15, color: 'bg-red-700' },
      { health: 30, speed: 3, reward: 8, color: 'bg-red-300' },
      { health: 120, speed: 1, reward: 25, color: 'bg-red-900' }
    ];

    const typeIndex = Math.min(Math.floor(wave / 3), enemyTypes.length - 1);
    const enemyType = enemyTypes[typeIndex];
    
    const newEnemy = {
      id: Date.now() + Math.random(),
      x: path[0].x,
      y: path[0].y,
      pathIndex: 0,
      health: enemyType.health,
      maxHealth: enemyType.health,
      speed: enemyType.speed,
      reward: enemyType.reward,
      color: enemyType.color
    };

    setEnemies(prev => [...prev, newEnemy]);
  }, [wave]);

  const placeTower = (gridX, gridY) => {
    if (currency < TOWER_COST) return;
    
    const x = gridX * 50 + 25;
    const y = gridY * 50 + 25;

    // Check if position is on path
    const onPath = path.some(point => 
      Math.abs(point.x - x) < 50 && Math.abs(point.y - y) < 50
    );
    if (onPath) return;

    // Check if tower already exists
    const existingTower = towers.find(tower => 
      Math.abs(tower.x - x) < 25 && Math.abs(tower.y - y) < 25
    );
    
    if (existingTower) {
      // Show upgrade menu for existing tower
      showUpgradeMenu(existingTower, { stopPropagation: () => {} });
      return;
    }

    // Close upgrade menu when placing new tower
    setSelectedTower(null);

    const newTower = {
      id: Date.now(),
      x,
      y,
      lastShot: 0,
      range: TOWER_RANGE,
      damage: TOWER_DAMAGE,
      level: 1,
      fireRate: 500,
      upgradeHistory: [], // Track which paths have been chosen
      availablePaths: ['damage', 'range', 'speed'], // Start with all paths available
      lockedPath: null // Which path gets locked after choosing 2 different ones
    };

    setTowers(prev => [...prev, newTower]);
    setCurrency(prev => prev - TOWER_COST);
  };

  const upgradeTower = (towerId, branch) => {
    const tower = towers.find(t => t.id === towerId);
    if (!tower || tower.level >= 5 || currency < UPGRADE_COST) return;
    
    // Check if this branch is available for this tower
    if (!tower.availablePaths.includes(branch)) return;

    setTowers(prev => prev.map(t => {
      if (t.id === towerId) {
        let upgrades = {};
        
        if (branch === 'damage') {
          upgrades = {
            damage: t.damage + 20,
            range: t.range + 5,
            fireRate: t.fireRate + 25
          };
        } else if (branch === 'range') {
          upgrades = {
            damage: t.damage + 5,
            range: t.range + 25,
            fireRate: t.fireRate + 10
          };
        } else if (branch === 'speed') {
          upgrades = {
            damage: t.damage + 10,
            range: t.range + 10,
            fireRate: Math.max(t.fireRate - 75, 100)
          };
        }
        
        // Update upgrade history
        const newUpgradeHistory = [...t.upgradeHistory];
        newUpgradeHistory.push(branch);
        
        // Get unique paths that have been chosen
        const uniquePaths = [...new Set(newUpgradeHistory)];
        
        // If we now have 2 different paths, lock the third one
        let newAvailablePaths = [...t.availablePaths];
        let newLockedPath = t.lockedPath;
        
        if (uniquePaths.length === 2 && !t.lockedPath) {
          const allPaths = ['damage', 'range', 'speed'];
          const unlockedPath = allPaths.find(path => !uniquePaths.includes(path));
          if (unlockedPath) {
            newAvailablePaths = newAvailablePaths.filter(path => path !== unlockedPath);
            newLockedPath = unlockedPath;
          }
        }
        
        return {
          ...t,
          level: t.level + 1,
          upgradeHistory: newUpgradeHistory,
          availablePaths: newAvailablePaths,
          lockedPath: newLockedPath,
          ...upgrades
        };
      }
      return t;
    }));
    
    setCurrency(prev => prev - UPGRADE_COST);
    setSelectedTower(null);
  };

  const showUpgradeMenu = (tower, event) => {
    event.stopPropagation();
    if (tower.level >= 5) return;
    
    setSelectedTower(tower);
    setUpgradeMenuPos({ x: tower.x + 50, y: tower.y });
  };

  const closeUpgradeMenu = () => {
    setSelectedTower(null);
  };

  const gameLoop = useCallback(() => {
    const now = Date.now();

    // Currency generation
    if (now - currencyTimerRef.current > 1000) {
      setCurrency(prev => prev + 5);
      currencyTimerRef.current = now;
    }

    // Enemy spawning (increased spawn rate)
    const spawnRate = Math.max(800 - (wave * 50), 200);
    if (now - lastSpawnRef.current > spawnRate) {
      spawnEnemy();
      lastSpawnRef.current = now;
    }

    // Move enemies
    setEnemies(prev => prev.map(enemy => {
      if (enemy.pathIndex >= path.length - 1) {
        setEnemiesReached(count => count + 1);
        return null;
      }

      const target = path[enemy.pathIndex + 1];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let newX = enemy.x;
      let newY = enemy.y;
      let newPathIndex = enemy.pathIndex;

      if (distance < enemy.speed * 3) {
        newPathIndex++;
        if (newPathIndex < path.length) {
          newX = path[newPathIndex].x;
          newY = path[newPathIndex].y;
        }
      } else {
        newX += (dx / distance) * enemy.speed;
        newY += (dy / distance) * enemy.speed;
      }

      return {
        ...enemy,
        x: newX,
        y: newY,
        pathIndex: newPathIndex
      };
    }).filter(Boolean));

    // Tower shooting
    setTowers(prev => prev.map(tower => {
      const nearestEnemy = enemies.find(enemy => {
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= tower.range;
      });

      if (nearestEnemy && now - tower.lastShot > tower.fireRate) {
        setBullets(prevBullets => [...prevBullets, {
          id: Date.now() + Math.random(),
          x: tower.x,
          y: tower.y,
          targetX: nearestEnemy.x,
          targetY: nearestEnemy.y,
          targetId: nearestEnemy.id, // Track which enemy this bullet is targeting
          damage: tower.damage,
          speed: 5
        }]);

        return { ...tower, lastShot: now };
      }

      return tower;
    }));

    // Move bullets and handle damage
    setBullets(prev => prev.map(bullet => {
      const dx = bullet.targetX - bullet.x;
      const dy = bullet.targetY - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bullet.speed) {
        // Hit target - find the specific enemy this bullet was targeting
        setEnemies(prevEnemies => prevEnemies.map(enemy => {
          // Only damage the enemy this bullet was specifically targeting
          if (enemy.id === bullet.targetId) {
            const newHealth = enemy.health - bullet.damage;
            if (newHealth <= 0) {
              setCurrency(prev => prev + enemy.reward);
              setScore(prev => prev + 1);
              return null;
            }
            return { ...enemy, health: newHealth };
          }
          return enemy;
        }).filter(Boolean));
        
        return null;
      }

      return {
        ...bullet,
        x: bullet.x + (dx / distance) * bullet.speed,
        y: bullet.y + (dy / distance) * bullet.speed
      };
    }).filter(Boolean));

  }, [enemies, towers, wave, spawnEnemy]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, 16);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [gameLoop, gameState]);

  // Update score ref whenever score changes
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Check game over
  useEffect(() => {
    if (enemiesReached >= 10 && gameState === 'playing') {
      const currentScore = scoreRef.current;
      setFinalScore(currentScore);
      setGameState('gameOver');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }, [enemiesReached, gameState]);

  // Increase wave
  useEffect(() => {
    const waveTimer = setInterval(() => {
      setWave(prev => prev + 1);
    }, 15000);
    
    return () => clearInterval(waveTimer);
  }, []);

  const renderGrid = () => {
    const tiles = [];
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 16; x++) {
        tiles.push(
          <div
            key={`${x}-${y}`}
            className="absolute border border-gray-300 hover:bg-blue-100 cursor-pointer opacity-50 z-10"
            style={{
              left: x * 50,
              top: y * 50,
              width: 50,
              height: 50
            }}
            onClick={(e) => {
              e.stopPropagation();
              placeTower(x, y);
            }}
          />
        );
      }
    }
    return tiles;
  };

  const getTowerColor = (tower) => {
    const uniquePaths = [...new Set(tower.upgradeHistory)];
    
    // If tower has upgrades, show mixed color based on chosen paths
    if (uniquePaths.length > 0) {
      if (uniquePaths.includes('damage') && uniquePaths.includes('range')) {
        return 'bg-purple-600 border-purple-800'; // damage + range
      } else if (uniquePaths.includes('damage') && uniquePaths.includes('speed')) {
        return 'bg-orange-600 border-orange-800'; // damage + speed
      } else if (uniquePaths.includes('range') && uniquePaths.includes('speed')) {
        return 'bg-teal-600 border-teal-800'; // range + speed
      } else if (uniquePaths.includes('damage')) {
        return 'bg-red-600 border-red-800';
      } else if (uniquePaths.includes('range')) {
        return 'bg-blue-600 border-blue-800';
      } else if (uniquePaths.includes('speed')) {
        return 'bg-yellow-600 border-yellow-800';
      }
    }

    // Default gray for new towers
    return 'bg-gray-600 border-gray-800';
  };

  if (gameState === 'gameOver') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-900 text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center bg-black bg-opacity-75 p-8 rounded-lg"
        >
          <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
          <p className="text-2xl mb-2">Final Score: {finalScore}</p>
          <p className="text-lg">Reloading in 3 seconds...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-800 p-4" onClick={closeUpgradeMenu}>
      {/* Back to Hub Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => window.location.href = '/hub'}
          className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Hub</span>
        </button>
      </div>

      {/* HUD */}
      <div className="mb-4 flex justify-between items-center text-white">
        <div className="flex space-x-6">
          <div>Currency: ${currency}</div>
          <div>Score: {score}</div>
          <div>Wave: {wave}</div>
          <div>Lives: {10 - enemiesReached}</div>
        </div>
        
        {/* Tower Upgrade Legend */}
        <div className="text-right text-sm">
          <div className="font-bold mb-1">Tower Colors</div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-gray-600 border border-gray-800 rounded"></div>
            <span>New Tower</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-red-600 border border-red-800 rounded"></div>
            <span>Damage Focus</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-blue-600 border border-blue-800 rounded"></div>
            <span>Range Focus</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-600 border border-yellow-800 rounded"></div>
            <span>Speed Focus</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div 
        className="relative bg-green-600 border-4 border-green-900 mx-auto"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Path */}
        <svg className="absolute inset-0 pointer-events-none z-0">
          <path
            d={`M ${path.map(p => `${p.x} ${p.y}`).join(' L ')}`}
            stroke="#8B4513"
            strokeWidth="40"
            fill="none"
          />
        </svg>

        {/* Grid */}
        {renderGrid()}

        {/* Towers */}
        <AnimatePresence>
          {towers.map(tower => {
            const colorClass = getTowerColor(tower);
            
            return (
              <motion.div
                key={`${tower.id}-${tower.upgradeHistory.join('-')}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute ${colorClass} rounded-full cursor-pointer hover:scale-110 transition-all duration-300 z-20`}
                style={{
                  left: tower.x - 15,
                  top: tower.y - 15,
                  width: 30,
                  height: 30
                }}
                onClick={(e) => showUpgradeMenu(tower, e)}
              >
                {/* Level indicator */}
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs z-30">
                  {tower.level}
                </div>
                
                {/* Range indicator when hovered */}
                <div
                  className="absolute border border-blue-400 rounded-full opacity-20 pointer-events-none z-0"
                  style={{
                    left: -tower.range + 15,
                    top: -tower.range + 15,
                    width: tower.range * 2,
                    height: tower.range * 2
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Enemies */}
        <AnimatePresence>
          {enemies.map(enemy => (
            <motion.div
              key={enemy.id}
              className={`absolute ${enemy.color} rounded-full border border-black z-15`}
              style={{
                left: enemy.x - 10,
                top: enemy.y - 15, // Adjusted to make room for health bar
                width: 20,
                height: 20
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {/* Health bar - positioned above the enemy */}
              <div className="absolute -top-4 left-0 w-full h-2 bg-red-800 rounded z-16 border border-black">
                <div
                  className="h-full bg-green-400 rounded transition-all duration-200"
                  style={{ width: `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%` }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bullets */}
        <AnimatePresence>
          {bullets.map(bullet => (
            <motion.div
              key={bullet.id}
              className="absolute bg-yellow-400 rounded-full z-15"
              style={{
                left: bullet.x - 2,
                top: bullet.y - 2,
                width: 4,
                height: 4
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            />
          ))}
        </AnimatePresence>

        {/* Upgrade Menu */}
        {selectedTower && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute bg-black bg-opacity-90 text-white p-4 rounded-lg border border-gray-600 z-50"
            style={{
              left: Math.min(upgradeMenuPos.x, GAME_WIDTH - 250),
              top: Math.min(upgradeMenuPos.y, GAME_HEIGHT - 220)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3">Upgrade Tower (Level {selectedTower.level})</h3>
            {selectedTower.lockedPath && (
              <div className="text-xs mb-3 text-red-400">
                {selectedTower.lockedPath.charAt(0).toUpperCase() + selectedTower.lockedPath.slice(1)} path locked after choosing 2 different paths
              </div>
            )}
            <div className="text-xs mb-3 text-gray-300">
              Upgrade history: {selectedTower.upgradeHistory.length > 0 ? selectedTower.upgradeHistory.join(', ') : 'None'}
            </div>
            <div className="space-y-2">
              {selectedTower.availablePaths.includes('damage') && (
                <button
                  className="w-full bg-red-600 hover:bg-red-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  onClick={() => upgradeTower(selectedTower.id, 'damage')}
                  disabled={currency < UPGRADE_COST}
                >
                  <div className="font-bold">Damage Branch (${UPGRADE_COST})</div>
                  <div className="text-xs">+20 damage, +5 range, +25 fire rate</div>
                </button>
              )}
              {!selectedTower.availablePaths.includes('damage') && selectedTower.lockedPath === 'damage' && (
                <button
                  className="w-full bg-gray-500 p-2 rounded text-sm opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="font-bold">Damage Branch - LOCKED</div>
                  <div className="text-xs">Choose 2 different paths to lock the third</div>
                </button>
              )}
              {selectedTower.availablePaths.includes('range') && (
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  onClick={() => upgradeTower(selectedTower.id, 'range')}
                  disabled={currency < UPGRADE_COST}
                >
                  <div className="font-bold">Range Branch (${UPGRADE_COST})</div>
                  <div className="text-xs">+25 range, +5 damage, +10 fire rate</div>
                </button>
              )}
              {!selectedTower.availablePaths.includes('range') && selectedTower.lockedPath === 'range' && (
                <button
                  className="w-full bg-gray-500 p-2 rounded text-sm opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="font-bold">Range Branch - LOCKED</div>
                  <div className="text-xs">Choose 2 different paths to lock the third</div>
                </button>
              )}
              {selectedTower.availablePaths.includes('speed') && (
                <button
                  className="w-full bg-yellow-600 hover:bg-yellow-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  onClick={() => upgradeTower(selectedTower.id, 'speed')}
                  disabled={currency < UPGRADE_COST}
                >
                  <div className="font-bold">Speed Branch (${UPGRADE_COST})</div>
                  <div className="text-xs">-75 fire rate, +10 damage, +10 range</div>
                </button>
              )}
              {!selectedTower.availablePaths.includes('speed') && selectedTower.lockedPath === 'speed' && (
                <button
                  className="w-full bg-gray-500 p-2 rounded text-sm opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="font-bold">Speed Branch - LOCKED</div>
                  <div className="text-xs">Choose 2 different paths to lock the third</div>
                </button>
              )}
            </div>
            <div className="mt-3 text-xs text-gray-300">
              Current: {selectedTower.damage} dmg, {selectedTower.range} range, {selectedTower.fireRate}ms
            </div>
          </motion.div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-white text-center">
        <p>Click on empty tiles to place towers (${TOWER_COST} each) | Click on towers to open upgrade menu (${UPGRADE_COST} each)</p>
        <p>Choose any upgrade paths, but after picking 2 different paths, the third becomes locked!</p>
        <p>Tower colors change based on chosen upgrade paths. Plan your strategy carefully!</p>
      </div>
    </div>
  );
};

export default TowerDefenseGame;