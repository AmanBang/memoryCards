'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { database } from '../firebase/config';
import { ref, set, onValue, off, remove, get, serverTimestamp, onDisconnect } from 'firebase/database';
import { generateUniqueId } from '../utils/helpers';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'tough' | 'genius';

export interface Card {
  id: number;
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface PlayerInfo {
  displayName: string;
  photoURL: string;
  score: number;
  online?: boolean;
}

export interface GameState {
  cards: Card[];
  currentPlayer: string;
  players: {
    [uid: string]: PlayerInfo;
  };
  status: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  difficulty: Difficulty;
  startTime: number | null;
  endTime: number | null;
  createdAt?: number;
}

export interface GameContextType {
  gameId: string | null;
  gameState: GameState | null;
  createGame: (difficulty: Difficulty) => Promise<string>;
  joinGame: (gameId: string) => Promise<boolean>;
  leaveGame: () => Promise<void>;
  flipCard: (cardId: number) => Promise<void>;
  resetGame: () => Promise<void>;
  isLoading: boolean;
  testConnection: () => Promise<boolean>;
  isOffline: boolean;
}

const initialGameState: GameState = {
  cards: [],
  currentPlayer: '',
  players: {},
  status: 'waiting',
  winner: null,
  difficulty: 'easy',
  startTime: null,
  endTime: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online');
      setIsOffline(false);
      // If we have a gameId, refresh the data
      if (gameId) {
        refreshGameData(gameId);
      }
    };

    const handleOffline = () => {
      console.log('App is offline');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [gameId]);

  // Function to refresh game data when coming back online
  const refreshGameData = async (id: string) => {
    if (!user) return;
    
    try {
      const gameRef = ref(database, `games/${id}`);
      const snapshot = await get(gameRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Refreshed game data:', data);
        setGameState(data);
      } else {
        console.log('Game no longer exists');
        setGameId(null);
        setGameState(null);
      }
    } catch (error) {
      console.error('Error refreshing game data:', error);
    }
  };

  // Listen for game state changes
  useEffect(() => {
    if (!gameId || !user) return;

    console.log('Setting up listener for game:', gameId);
    const gameRef = ref(database, `games/${gameId}`);
    
    setIsLoading(true);
    
    // Setup presence for this player
    const presenceRef = ref(database, `games/${gameId}/players/${user.uid}/online`);
    onDisconnect(presenceRef).set(false);
    set(presenceRef, true);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('Game data received:', data);
        setGameState(data);
      } else {
        // Game was deleted or doesn't exist
        console.log('Game not found or deleted:', gameId);
        setGameId(null);
        setGameState(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to game updates:', error);
      // Handle offline state - keep the current state rather than clearing it
      setIsLoading(false);
      setIsOffline(true);
    });

    return () => {
      console.log('Removing listener for game:', gameId);
      off(gameRef);
      // Clear the disconnect handler if component unmounts
      onDisconnect(presenceRef).cancel();
    };
  }, [gameId, user]);

  // Create a new game
  const createGame = async (difficulty: Difficulty): Promise<string> => {
    if (!user) throw new Error('User must be logged in to create a game');
    if (isOffline) throw new Error('Cannot create game while offline');
    
    console.log('Creating new game with difficulty:', difficulty);
    setIsLoading(true);
    
    try {
      const newGameId = generateUniqueId();
      console.log('Generated game ID:', newGameId);
      
      const cardCount = getCardCountByDifficulty(difficulty);
      const cards = generateCards(cardCount);
      
      const newGameState: GameState = {
        ...initialGameState,
        cards,
        currentPlayer: user.uid,
        players: {
          [user.uid]: {
            displayName: user.displayName || 'Player 1',
            photoURL: user.photoURL || '',
            score: 0,
            online: true
          },
        },
        difficulty,
        startTime: null,
        createdAt: Date.now()
      };
      
      console.log('Saving game state to Firebase:', newGameState);
      
      try {
        // Now create the actual game
        const gameRef = ref(database, `games/${newGameId}`);
        await set(gameRef, newGameState);
        console.log('Game state saved successfully');
        
        console.log('Setting game ID in context:', newGameId);
        setGameId(newGameId);
        setIsOffline(false);
        
        return newGameId;
      } catch (dbError: any) {
        console.error('Firebase error:', dbError.code, dbError.message);
        throw new Error(`Firebase error: ${dbError.message}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing game
  const joinGame = async (id: string): Promise<boolean> => {
    if (!user) throw new Error('User must be logged in to join a game');
    
    setIsLoading(true);
    
    try {
      const gameRef = ref(database, `games/${id}`);
      
      return new Promise((resolve) => {
        onValue(gameRef, async (snapshot) => {
          const data = snapshot.val() as GameState | null;
          
          if (!data) {
            setIsLoading(false);
            resolve(false);
            return;
          }
          
          // Check if game is full (more than 2 players)
          if (Object.keys(data.players).length >= 2 && !data.players[user.uid]) {
            setIsLoading(false);
            resolve(false);
            return;
          }
          
          // Add player to the game if not already in
          if (!data.players[user.uid]) {
            const updatedPlayers = {
              ...data.players,
              [user.uid]: {
                displayName: user.displayName || 'Player 2',
                photoURL: user.photoURL || '',
                score: 0,
              },
            };
            
            // If game was waiting and now has 2 players, start it
            let updatedStatus = data.status;
            let startTime = data.startTime;
            
            if (data.status === 'waiting' && Object.keys(updatedPlayers).length === 2) {
              updatedStatus = 'playing';
              startTime = Date.now();
            }
            
            await set(ref(database, `games/${id}`), {
              ...data,
              players: updatedPlayers,
              status: updatedStatus,
              startTime,
            });
          }
          
          setGameId(id);
          setIsLoading(false);
          resolve(true);
        }, {
          onlyOnce: true
        });
      });
    } catch (error) {
      console.error('Error joining game:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Leave the current game
  const leaveGame = async (): Promise<void> => {
    if (!gameId || !user || !gameState) return;
    
    setIsLoading(true);
    
    try {
      // If there's only one player, delete the game
      if (Object.keys(gameState.players).length === 1) {
        await remove(ref(database, `games/${gameId}`));
      } else {
        // Remove the player from the game
        const { [user.uid]: _, ...remainingPlayers } = gameState.players;
        
        // If game was playing, set it back to waiting
        const updatedStatus = gameState.status === 'playing' ? 'waiting' : gameState.status;
        
        await set(ref(database, `games/${gameId}`), {
          ...gameState,
          players: remainingPlayers,
          status: updatedStatus,
          currentPlayer: Object.keys(remainingPlayers)[0],
        });
      }
      
      setGameId(null);
      setGameState(null);
    } catch (error) {
      console.error('Error leaving game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Flip a card
  const flipCard = async (cardId: number): Promise<void> => {
    if (!gameId || !user || !gameState) return;
    if (isOffline) {
      console.error('Cannot flip card while offline');
      return;
    }
    
    // Check if it's the user's turn
    if (gameState.currentPlayer !== user.uid || gameState.status !== 'playing') return;
    
    // Find the card
    const cardIndex = gameState.cards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = gameState.cards[cardIndex];
    
    // Can't flip already matched or flipped cards
    if (card.isMatched || card.isFlipped) return;
    
    // Count currently flipped but not matched cards
    const flippedCards = gameState.cards.filter(c => c.isFlipped && !c.isMatched);
    
    // If already two cards flipped, return
    if (flippedCards.length >= 2) return;
    
    // Create a copy of the cards array
    const updatedCards = [...gameState.cards];
    updatedCards[cardIndex] = { ...card, isFlipped: true };
    
    try {
      // Update the game state
      await set(ref(database, `games/${gameId}/cards`), updatedCards);
      
      // If this is the second card flipped, check for a match
      if (flippedCards.length === 1) {
        const firstCard = flippedCards[0];
        
        // Check if the cards match
        if (firstCard.value === card.value) {
          // Cards match - handle the match locally first to avoid UI freezing
          const currentCards = [...updatedCards];
          const firstCardIndex = currentCards.findIndex(c => c.id === firstCard.id);
          
          // Update local state to show match
          const localGameState = {...gameState};
          localGameState.cards = currentCards;
          currentCards[firstCardIndex] = { ...currentCards[firstCardIndex], isMatched: true };
          currentCards[cardIndex] = { ...currentCards[cardIndex], isMatched: true };
          
          // Update player score locally
          if (!localGameState.players[user.uid]) {
            console.error('Player not found in game state');
            return;
          }
          
          localGameState.players[user.uid].score += 1;
          setGameState(localGameState);
          
          // Update on server after a delay to prevent freezing
          setTimeout(async () => {
            try {
              // Check if all cards are matched
              const allMatched = currentCards.every(c => c.isMatched);
              
              // Update the matched cards
              await set(ref(database, `games/${gameId}/cards`), currentCards);
              await set(ref(database, `games/${gameId}/players/${user.uid}/score`), 
                        localGameState.players[user.uid].score);
              
              if (allMatched) {
                // Game is finished
                await set(ref(database, `games/${gameId}/status`), 'finished');
                await set(ref(database, `games/${gameId}/endTime`), Date.now());
                
                // Determine winner based on scores
                const playerScores = Object.entries(localGameState.players).map(([id, data]) => ({
                  id,
                  score: data.score,
                }));
                
                playerScores.sort((a, b) => b.score - a.score);
                
                let winner = null;
                if (playerScores.length > 1) {
                  if (playerScores[0].score > playerScores[1].score) {
                    winner = playerScores[0].id;
                  }
                  // If scores are equal, winner remains null (tie)
                } else if (playerScores.length === 1) {
                  winner = playerScores[0].id;
                }
                
                await set(ref(database, `games/${gameId}/winner`), winner);
              }
            } catch (error) {
              console.error('Error updating matched cards:', error);
            }
          }, 300);
        } else {
          // Cards don't match, flip them back after a delay
          setTimeout(async () => {
            try {
              const currentCards = [...updatedCards];
              const firstCardIndex = currentCards.findIndex(c => c.id === firstCard.id);
              
              currentCards[firstCardIndex] = { ...currentCards[firstCardIndex], isFlipped: false };
              currentCards[cardIndex] = { ...currentCards[cardIndex], isFlipped: false };
              
              // Switch to the other player
              const playerIds = Object.keys(gameState.players);
              const nextPlayerIndex = playerIds.indexOf(user.uid) === 0 ? 1 : 0;
              const nextPlayer = playerIds[nextPlayerIndex] || playerIds[0];
              
              await set(ref(database, `games/${gameId}/cards`), currentCards);
              await set(ref(database, `games/${gameId}/currentPlayer`), nextPlayer);
            } catch (error) {
              console.error('Error updating non-matched cards:', error);
            }
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error flipping card:', error);
    }
  };

  // Reset the game
  const resetGame = async (): Promise<void> => {
    if (!gameId || !gameState) return;
    
    setIsLoading(true);
    
    try {
      const cardCount = getCardCountByDifficulty(gameState.difficulty);
      const cards = generateCards(cardCount);
      
      // Reset player scores
      const resetPlayers = Object.fromEntries(
        Object.entries(gameState.players).map(([id, player]) => [
          id,
          { ...player, score: 0 }
        ])
      );
      
      const updatedGameState: GameState = {
        ...gameState,
        cards,
        players: resetPlayers,
        status: 'playing',
        winner: null,
        currentPlayer: Object.keys(resetPlayers)[0],
        startTime: Date.now(),
        endTime: null,
      };
      
      await set(ref(database, `games/${gameId}`), updatedGameState);
    } catch (error) {
      console.error('Error resetting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test Firebase connection
  const testConnection = async (): Promise<boolean> => {
    try {
      const testId = `test-${Date.now()}`;
      const testRef = ref(database, `tests/${testId}`);
      await set(testRef, {
        timestamp: Date.now(),
        message: 'Connection test'
      });
      console.log('Firebase connection test successful');
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  };

  // Helper functions
  const getCardCountByDifficulty = (difficulty: Difficulty): number => {
    switch (difficulty) {
      case 'easy': return 8; // 16 cards (8 pairs)
      case 'medium': return 18; // 36 cards (18 pairs)
      case 'hard': return 32; // 64 cards (32 pairs)
      case 'tough': return 50; // 100 cards (50 pairs)
      case 'genius': return 60; // 120 cards (60 pairs)
      default: return 8;
    }
  };

  const generateCards = (pairCount: number): Card[] => {
    const cards: Card[] = [];
    
    // Create pairs of cards
    for (let i = 0; i < pairCount; i++) {
      cards.push(
        { id: i * 2, value: i, isFlipped: false, isMatched: false },
        { id: i * 2 + 1, value: i, isFlipped: false, isMatched: false }
      );
    }
    
    // Shuffle the cards using Fisher-Yates algorithm
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    return cards;
  };

  const value = {
    gameId,
    gameState,
    createGame,
    joinGame,
    leaveGame,
    flipCard,
    resetGame,
    isLoading,
    testConnection,
    isOffline
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}