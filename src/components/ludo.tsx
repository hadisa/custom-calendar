'use client';

import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';

// Define TypeScript interfaces for better type safety
interface Position {
    row: number;
    col: number;
}

interface Piece {
    color: string;
    id: string;
    position: Position;
    pathIndex: number; // -1 for start area, 0 to 51 for main path, 0 to 5 for home path
    inHomePath: boolean;
    isHome: boolean; // True if piece has reached the center home
}

interface Player {
    id: string;
    color: string;
    pieces: Piece[];
    hasWon: boolean;
}

interface GameState {
    players: Player[];
    piecesPositions: { [key: string]: Piece[] };
    currentPlayerIndex: number;
    diceValue: number;
    message: string;
    gameStarted: boolean;
}

// Ensure Tailwind CSS is available in the environment.
// This code assumes Tailwind CSS is configured and available.

// Define the board structure and paths
const BOARD_SIZE = 15; // 15x15 grid for the Ludo board
const CELL_SIZE = 'w-12 h-12 sm:w-16 sm:h-16 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20'; // Responsive cell size

// Define player colors and their paths
const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];

// Define the main path coordinates (simplified for a visual representation)
// This array represents the sequence of cells a piece moves through on the main track.
// The indices are 0-based for easy array access.
const MAIN_PATH_COORDS: Position[] = [
    // Red's path start (0-based index 0)
    { row: 6, col: 1 },
    { row: 6, col: 2 },
    { row: 6, col: 3 },
    { row: 6, col: 4 },
    { row: 6, col: 5 },
    { row: 5, col: 6 },
    { row: 4, col: 6 },
    { row: 3, col: 6 },
    { row: 2, col: 6 },
    { row: 1, col: 6 },
    { row: 0, col: 6 },
    { row: 0, col: 7 },
    { row: 0, col: 8 }, // Top corner
    { row: 1, col: 8 },
    { row: 2, col: 8 },
    { row: 3, col: 8 },
    { row: 4, col: 8 },
    { row: 5, col: 8 },
    { row: 6, col: 9 },
    { row: 6, col: 10 },
    { row: 6, col: 11 },
    { row: 6, col: 12 },
    { row: 6, col: 13 },
    { row: 6, col: 14 },
    { row: 7, col: 14 },
    { row: 8, col: 14 }, // Right corner
    { row: 8, col: 13 },
    { row: 8, col: 12 },
    { row: 8, col: 11 },
    { row: 8, col: 10 },
    { row: 8, col: 9 },
    { row: 9, col: 8 },
    { row: 10, col: 8 },
    { row: 11, col: 8 },
    { row: 12, col: 8 },
    { row: 13, col: 8 },
    { row: 14, col: 8 },
    { row: 14, col: 7 },
    { row: 14, col: 6 }, // Bottom corner
    { row: 13, col: 6 },
    { row: 12, col: 6 },
    { row: 11, col: 6 },
    { row: 10, col: 6 },
    { row: 9, col: 6 },
    { row: 8, col: 5 },
    { row: 8, col: 4 },
    { row: 8, col: 3 },
    { row: 8, col: 2 },
    { row: 8, col: 1 },
    { row: 8, col: 0 },
    { row: 7, col: 0 } // Left corner
];

// Define the home path coordinates for each color
const HOME_PATH_COORDS: { [key: string]: Position[] } = {
    red: [
        { row: 7, col: 1 },
        { row: 7, col: 2 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 6 }
    ], // Red home path
    green: [
        { row: 1, col: 7 },
        { row: 2, col: 7 },
        { row: 3, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 6, col: 7 }
    ], // Green home path
    yellow: [
        { row: 7, col: 13 },
        { row: 7, col: 12 },
        { row: 7, col: 11 },
        { row: 7, col: 10 },
        { row: 7, col: 9 },
        { row: 7, col: 8 }
    ], // Yellow home path
    blue: [
        { row: 13, col: 7 },
        { row: 12, col: 7 },
        { row: 11, col: 7 },
        { row: 10, col: 7 },
        { row: 9, col: 7 },
        { row: 8, col: 7 }
    ] // Blue home path
};

// Define the starting positions for each color
const START_POSITIONS: { [key: string]: Position[] } = {
    red: [
        { row: 12, col: 2 },
        { row: 12, col: 3 },
        { row: 11, col: 2 },
        { row: 11, col: 3 }
    ],
    green: [
        { row: 2, col: 11 },
        { row: 2, col: 12 },
        { row: 3, col: 11 },
        { row: 3, col: 12 }
    ],
    yellow: [
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 3, col: 2 },
        { row: 3, col: 3 }
    ],
    blue: [
        { row: 11, col: 11 },
        { row: 11, col: 12 },
        { row: 12, col: 11 },
        { row: 12, col: 12 }
    ]
};

// Define the entry points to the main path for each color
const ENTRY_POINTS: { [key: string]: Position } = {
    red: { row: 6, col: 1 },
    green: { row: 1, col: 8 },
    yellow: { row: 8, col: 13 },
    blue: { row: 13, col: 6 }
};

// Define the entry points to the home path for each color
const HOME_ENTRY_POINTS: { [key: string]: Position } = {
    red: { row: 7, col: 1 }, // This is the first cell of the red home path
    green: { row: 1, col: 7 }, // This is the first cell of the green home path
    yellow: { row: 7, col: 13 }, // This is the first cell of the yellow home path
    blue: { row: 13, col: 7 } // This is the first cell of the blue home path
};

// Utility function to get cell class based on its type
const getCellClass = (row: number, col: number): string => {
    let classes = 'border border-gray-300 flex items-center justify-center relative';

    // Center cell (home triangle)
    if (row === 7 && col === 7) {
        classes += ' bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full shadow-lg';
    }
    // Player start areas
    else if (
        (row >= 0 && row <= 5 && col >= 0 && col <= 5) || // Yellow (top-left)
        (row >= 0 && row <= 5 && col >= 9 && col <= 14) || // Green (top-right)
        (row >= 9 && row <= 14 && col >= 0 && col <= 5) || // Red (bottom-left)
        (row >= 9 && row <= 14 && col >= 9 && col <= 14)
    ) {
        // Blue (bottom-right)
        classes += ' bg-gray-100 dark:bg-gray-800';
    }
    // Main path cells
    else if (MAIN_PATH_COORDS.some((coord) => coord.row === row && coord.col === col)) {
        classes += ' bg-white dark:bg-gray-700';
    }
    // Home path cells
    else if (
        Object.values(HOME_PATH_COORDS)
            .flat()
            .some((coord) => coord.row === row && coord.col === col)
    ) {
        classes += ' bg-white dark:bg-gray-700';
    }
    // Safe spots (stars or specific colors)
    else if (
        (row === 6 && col === 1) ||
        (row === 1 && col === 8) || // Red & Green entry
        (row === 8 && col === 13) ||
        (row === 13 && col === 6) || // Yellow & Blue entry
        (row === 6 && col === 8) ||
        (row === 8 && col === 6) || // Middle safe spots
        (row === 1 && col === 6) ||
        (row === 6 && col === 13) || // More safe spots
        (row === 13 && col === 8) ||
        (row === 8 && col === 1) // More safe spots
    ) {
        classes += ' bg-yellow-200 dark:bg-yellow-700'; // Example safe spot color
    }
    // Default empty cells
    else {
        classes += ' bg-gray-50 dark:bg-gray-900';
    }

    return classes;
};

// Component for a single Ludo piece
interface LudoPieceProps {
    color: string;
    pieceId: string; // Added pieceId for identification
    targetRow: number; // Target grid row for animation
    targetCol: number; // Target grid col for animation
    cellDimensions: { width: number; height: number } | null; // Dimensions of a single cell
    onClick: () => void;
    isMovable: boolean;
    isSelected: boolean;
}

const LudoPiece: React.FC<LudoPieceProps> = ({
    color = 'red', // Default color if not provided
    pieceId,
    targetRow,
    targetCol,
    cellDimensions,
    onClick,
    isMovable,
    isSelected
}) => {
    // Determine the base color class for the piece based on the 'color' prop
    const baseColorClass = {
        red: 'bg-red-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500'
    }[color]; // This directly maps the color string to a Tailwind class

    const movableClass = isMovable
        ? 'cursor-pointer animate-pulse ring-4 ring-offset-2 ring-blue-400'
        : 'cursor-not-allowed opacity-70';
    const selectedClass = isSelected ? 'border-4 border-white shadow-lg' : '';

    // Log the rendering information for debugging
    console.log(`Rendering piece ${pieceId} at row ${targetRow}, col ${targetCol}, color ${color}`);

    if (!cellDimensions) return null; // Don't render until dimensions are known

    const pieceWidth = cellDimensions.width * 0.6; // 60% of cell width
    const pieceHeight = cellDimensions.height * 0.6; // 60% of cell height
    const pieceTopOffset = cellDimensions.height * 0.2; // 20% offset to center in cell
    const pieceLeftOffset = cellDimensions.width * 0.2; // 20% offset to center in cell

    return (
        <div
            className={`absolute rounded-full shadow-md ${baseColorClass}`} // Use the dynamically determined baseColorClass here
            style={{
                width: pieceWidth,
                height: pieceHeight,
                top: targetRow * cellDimensions.height + pieceTopOffset,
                left: targetCol * cellDimensions.width + pieceLeftOffset,
                transition: 'top 0.5s ease-out, left 0.5s ease-out', // Smooth CSS transition for movement
                zIndex: isSelected ? 10 : 5 // Bring selected piece to front
            }}
            onClick={onClick}>
            {/* Inner div for movable/selected styles, to avoid animating ring/border */}
            <div className={`h-full w-full rounded-full ${movableClass} ${selectedClass}`}></div>
        </div>
    );
};

// Component for the Dice
interface DiceProps {
    value: number;
    onRoll: () => void;
    isRolling: boolean;
    currentPlayerColor: string;
}

const Dice: React.FC<DiceProps> = ({ value, onRoll, isRolling, currentPlayerColor }) => {
    const diceColorClass =
        {
            red: 'bg-red-600',
            green: 'bg-green-600',
            yellow: 'bg-yellow-600',
            blue: 'bg-blue-600'
        }[currentPlayerColor] || 'bg-gray-600';

    return (
        <div className='flex flex-col items-center justify-center p-4'>
            <div
                className={`h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36 ${diceColorClass} flex transform items-center justify-center rounded-xl text-5xl font-bold text-white shadow-xl transition-transform duration-300 ease-in-out sm:text-6xl md:text-7xl lg:text-8xl ${isRolling ? 'animate-spin-once' : ''}`}>
                {value}
            </div>
            <button
                onClick={onRoll}
                disabled={isRolling}
                className='mt-4 transform rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition duration-300 ease-in-out hover:scale-105 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                {isRolling ? 'Rolling...' : 'Roll Dice'}
            </button>
        </div>
    );
};

// Main App Component
export default function App(): JSX.Element {
    // Replaced Firebase states with local storage logic
    const [userId, setUserId] = useState<string>('dummy-user-id-' + Math.random().toString(36).substring(2, 9)); // Dummy user ID

    const [players, setPlayers] = useState<Player[]>([]);
    const [piecesPositions, setPiecesPositions] = useState<{ [key: string]: Piece[] }>({});
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
    const [diceValue, setDiceValue] = useState<number>(1);
    const [message, setMessage] = useState<string>('Welcome to Ludo!');
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null); // pieceId string
    const [movablePieces, setMovablePieces] = useState<string[]>([]); // Array of pieceIds that can move

    const boardRef = useRef<HTMLDivElement>(null);
    const [cellDimensions, setCellDimensions] = useState<{ width: number; height: number } | null>(null);

    // Audio references
    const diceRollSoundRef = useRef<HTMLAudioElement | null>(null);
    const pieceMoveSoundRef = useRef<HTMLAudioElement | null>(null);
    const winSoundRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio elements on component mount
    useEffect(() => {
        diceRollSoundRef.current = new Audio('/sounds/dice-roll.mp3');
        pieceMoveSoundRef.current = new Audio('/sounds/piece-move.mp3');
        winSoundRef.current = new Audio('/sounds/win.mp3');
        // Preload sounds to ensure they are ready when needed
        diceRollSoundRef.current.load();
        pieceMoveSoundRef.current.load();
        winSoundRef.current.load();
    }, []);

    // Function to calculate cell dimensions
    const calculateCellDimensions = useCallback(() => {
        if (boardRef.current) {
            const boardRect = boardRef.current.getBoundingClientRect();
            const cellWidth = boardRect.width / BOARD_SIZE;
            const cellHeight = boardRect.height / BOARD_SIZE;
            setCellDimensions({ width: cellWidth, height: cellHeight });
        }
    }, []);

    // Effect to calculate cell dimensions on mount and resize
    useEffect(() => {
        // Use a MutationObserver to watch for changes in board size or layout
        const observer = new MutationObserver(calculateCellDimensions);
        if (boardRef.current) {
            observer.observe(boardRef.current, { attributes: true, childList: true, subtree: true });
        }
        window.addEventListener('resize', calculateCellDimensions);
        calculateCellDimensions(); // Initial calculation

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', calculateCellDimensions);
        };
    }, [calculateCellDimensions]);

    // Function to initialize or reset the game state
    const initializeGame = useCallback(() => {
        const initialPlayers: Player[] = PLAYER_COLORS.map((color) => ({
            id: color,
            color: color,
            pieces: Array(4)
                .fill(null)
                .map((_, i) => ({
                    id: `${color}-${i}`,
                    position: START_POSITIONS[color][i], // Initial position in the start area
                    pathIndex: -1, // -1 means in the start area
                    inHomePath: false,
                    isHome: false // True if piece has reached the center home
                })),
            hasWon: false
        }));

        const initialPiecesPositions: { [key: string]: Piece[] } = {};
        initialPlayers.forEach((player) => {
            initialPiecesPositions[player.color] = player.pieces;
        });

        const initialState: GameState = {
            players: initialPlayers,
            piecesPositions: initialPiecesPositions,
            currentPlayerIndex: 0,
            diceValue: 1,
            message: `${initialPlayers[0].color.charAt(0).toUpperCase() + initialPlayers[0].color.slice(1)}'s turn. Roll the dice!`,
            gameStarted: true
        };

        setPlayers(initialState.players);
        setPiecesPositions(initialState.piecesPositions);
        setCurrentPlayerIndex(initialState.currentPlayerIndex);
        setDiceValue(initialState.diceValue);
        setMessage(initialState.message);
        setGameStarted(initialState.gameStarted);
        setSelectedPiece(null);
        setMovablePieces([]);

        // Save initial state to local storage
        localStorage.setItem('ludoGameState', JSON.stringify(initialState));
    }, []);

    // Load game state from local storage on component mount
    useEffect(() => {
        try {
            const savedState = localStorage.getItem('ludoGameState');
            if (savedState) {
                const parsedState: GameState = JSON.parse(savedState);
                setPlayers(parsedState.players);
                setPiecesPositions(parsedState.piecesPositions);
                setCurrentPlayerIndex(parsedState.currentPlayerIndex);
                setDiceValue(parsedState.diceValue);
                setMessage(parsedState.message);
                setGameStarted(parsedState.gameStarted);
                console.log('Game state loaded from local storage.');
            } else {
                initializeGame(); // Initialize a new game if no saved state
            }
        } catch (error) {
            console.error('Error loading game state from local storage:', error);
            setMessage('Error loading game. Starting a new one.');
            initializeGame(); // Fallback to new game on error
        }
    }, [initializeGame]); // Depend on initializeGame

    // Save game state to local storage whenever relevant state variables change
    useEffect(() => {
        // Only save if the game has started to avoid saving empty initial state on first render
        if (gameStarted) {
            const currentState: GameState = {
                players,
                piecesPositions,
                currentPlayerIndex,
                diceValue,
                message,
                gameStarted
            };
            try {
                localStorage.setItem('ludoGameState', JSON.stringify(currentState));
                // console.log("Game state saved to local storage.");
            } catch (error) {
                console.error('Error saving game state to local storage:', error);
            }
        }
    }, [players, piecesPositions, currentPlayerIndex, diceValue, message, gameStarted]);

    // Define nextTurn before it's used by other callbacks
    const nextTurn = useCallback(() => {
        setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % PLAYER_COLORS.length);
        const nextPlayer = players[(currentPlayerIndex + 1) % PLAYER_COLORS.length];
        setMessage(`${nextPlayer.color.charAt(0).toUpperCase() + nextPlayer.color.slice(1)}'s turn. Roll the dice!`);
        setSelectedPiece(null);
        setMovablePieces([]);
    }, [currentPlayerIndex, players]);

    const checkWinCondition = useCallback(
        (playerColor: string) => {
            const playerPieces = piecesPositions[playerColor];
            const allPiecesInHome = playerPieces.every((piece) => piece.isHome);

            if (allPiecesInHome) {
                const updatedPlayers = players.map((p) => (p.color === playerColor ? { ...p, hasWon: true } : p));
                setPlayers(updatedPlayers);
                setMessage(`${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} wins! Game Over!`);
                setGameStarted(false); // End the game
                if (winSoundRef.current) {
                    winSoundRef.current.play().catch((e) => console.error('Error playing win sound:', e));
                }
            }
        },
        [players, piecesPositions]
    );

    const movePiece = useCallback(
        (pieceId: string, roll: number) => {
            const currentPlayer = players[currentPlayerIndex];
            const currentPieces = [...piecesPositions[currentPlayer.color]];
            const pieceIndex = currentPieces.findIndex((p) => p.id === pieceId);
            if (pieceIndex === -1) return;

            const pieceToMove = { ...currentPieces[pieceIndex] };

            let newPosition: Position | null = null;
            let newPathIndex: number = pieceToMove.pathIndex;
            let newInHomePath: boolean = pieceToMove.inHomePath;
            let newIsHome: boolean = pieceToMove.isHome;

            // Logic for moving out of start area
            if (pieceToMove.pathIndex === -1) {
                if (roll === 6) {
                    newPosition = ENTRY_POINTS[currentPlayer.color];
                    newPathIndex = MAIN_PATH_COORDS.findIndex(
                        (coord) => coord.row === newPosition!.row && coord.col === newPosition!.col
                    );
                    setMessage(`${currentPlayer.color} piece moved to start!`);
                } else {
                    setMessage(`You need a 6 to move out of the start area.`);
                    nextTurn(); // End turn if no 6

                    return;
                }
            }
            // Logic for moving on main path or into home path
            else if (!pieceToMove.inHomePath) {
                const potentialNewPathIndex = pieceToMove.pathIndex + roll;

                // Check if piece enters home path
                const homePathEntryIndex = MAIN_PATH_COORDS.findIndex(
                    (coord) =>
                        coord.row === HOME_ENTRY_POINTS[currentPlayer.color].row &&
                        coord.col === HOME_ENTRY_POINTS[currentPlayer.color].col
                );

                if (pieceToMove.pathIndex < homePathEntryIndex && potentialNewPathIndex >= homePathEntryIndex) {
                    // Piece is entering home path
                    const stepsIntoHomePath = potentialNewPathIndex - homePathEntryIndex;
                    if (stepsIntoHomePath < HOME_PATH_COORDS[currentPlayer.color].length) {
                        newPosition = HOME_PATH_COORDS[currentPlayer.color][stepsIntoHomePath];
                        newPathIndex = stepsIntoHomePath; // Index within home path
                        newInHomePath = true;
                        setMessage(`${currentPlayer.color} piece entered home path!`);
                    } else if (stepsIntoHomePath === HOME_PATH_COORDS[currentPlayer.color].length) {
                        // Reached home center
                        newPosition = { row: 7, col: 7 }; // Center cell
                        newPathIndex = -2; // Special index for home
                        newInHomePath = false;
                        newIsHome = true;
                        setMessage(`${currentPlayer.color} piece reached home!`);
                    } else {
                        // Overshot home, cannot move
                        setMessage(`Cannot move ${roll} steps, overshoots home.`);
                        nextTurn();

                        return;
                    }
                }
                // Still on main path
                else if (potentialNewPathIndex < MAIN_PATH_COORDS.length) {
                    newPosition = MAIN_PATH_COORDS[potentialNewPathIndex];
                    newPathIndex = potentialNewPathIndex;
                    setMessage(`${currentPlayer.color} piece moved ${roll} steps.`);
                }
                // Overshot main path, but not entering home path yet (shouldn't happen with correct logic)
                else {
                    setMessage(`Cannot move ${roll} steps, overshoots main path.`);
                    nextTurn();

                    return;
                }
            }
            // Logic for moving on home path
            else if (pieceToMove.inHomePath) {
                const potentialNewHomePathIndex = pieceToMove.pathIndex + roll; // pathIndex here refers to home path index
                if (potentialNewHomePathIndex < HOME_PATH_COORDS[currentPlayer.color].length) {
                    newPosition = HOME_PATH_COORDS[currentPlayer.color][potentialNewHomePathIndex];
                    newPathIndex = potentialNewHomePathIndex;
                    setMessage(`${currentPlayer.color} piece moved ${roll} steps in home path.`);
                } else if (potentialNewHomePathIndex === HOME_PATH_COORDS[currentPlayer.color].length) {
                    // Reached home center
                    newPosition = { row: 7, col: 7 }; // Center cell
                    newPathIndex = -2; // Special index for home
                    newInHomePath = false;
                    newIsHome = true;
                    setMessage(`${currentPlayer.color} piece reached home!`);
                } else {
                    // Overshot home, cannot move
                    setMessage(`Cannot move ${roll} steps, overshoots home.`);
                    nextTurn();

                    return;
                }
            }

            pieceToMove.position = newPosition!; // Asserting non-null as logic ensures it's set
            pieceToMove.pathIndex = newPathIndex;
            pieceToMove.inHomePath = newInHomePath;
            pieceToMove.isHome = newIsHome;

            currentPieces[pieceIndex] = pieceToMove;

            setPiecesPositions((prev) => ({
                ...prev,
                [currentPlayer.color]: currentPieces
            }));

            // Play piece move sound
            if (pieceMoveSoundRef.current) {
                pieceMoveSoundRef.current.play().catch((e) => console.error('Error playing move sound:', e));
            }

            // Check for win condition after move
            checkWinCondition(currentPlayer.color);

            // If the piece reached home, the player gets another turn or if they rolled a 6
            if (newIsHome || roll === 6) {
                setMessage(`${currentPlayer.color} ${newIsHome ? 'reached home!' : 'rolled a 6!'} Roll again!`);
                setSelectedPiece(null);
                setMovablePieces([]);
                // Do not call nextTurn, player rolls again
            } else {
                nextTurn();
            }
        },
        [players, currentPlayerIndex, piecesPositions, checkWinCondition, nextTurn]
    );

    const handlePieceClick = useCallback(
        (pieceId: string) => {
            if (!gameStarted) {
                setMessage('Please roll the dice first!');

                return;
            }
            if (!movablePieces.includes(pieceId)) {
                setMessage('That piece cannot be moved. Choose a highlighted piece or roll the dice.');

                return;
            }

            setSelectedPiece(pieceId);
            // Perform the move immediately after selecting if it's a valid movable piece
            if (diceValue > 0) {
                // Ensure dice has been rolled
                movePiece(pieceId, diceValue);
                setSelectedPiece(null);
                setMovablePieces([]);
            } else {
                setMessage('Roll the dice before moving a piece!');
            }
        },
        [gameStarted, movablePieces, diceValue, movePiece]
    );

    const determineMovablePieces = useCallback(
        (roll: number) => {
            const currentPlayer = players[currentPlayerIndex];
            const currentPieces = piecesPositions[currentPlayer.color];
            const possibleMoves: string[] = [];

            currentPieces.forEach((piece) => {
                let canMove = false;
                // Case 1: Piece is in start area
                if (piece.pathIndex === -1) {
                    if (roll === 6) {
                        canMove = true; // Can move out of home
                    }
                }
                // Case 2: Piece is on main path
                else if (piece.pathIndex !== -1 && !piece.inHomePath) {
                    const newPathIndex = piece.pathIndex + roll;
                    if (newPathIndex < MAIN_PATH_COORDS.length) {
                        // Still on main path
                        canMove = true;
                    } else {
                        // Check if it can enter home path
                        const homePathEntryIndex = MAIN_PATH_COORDS.findIndex(
                            (coord) =>
                                coord.row === HOME_ENTRY_POINTS[currentPlayer.color].row &&
                                coord.col === HOME_ENTRY_POINTS[currentPlayer.color].col
                        );
                        if (piece.pathIndex < homePathEntryIndex && newPathIndex >= homePathEntryIndex) {
                            // Calculate remaining steps for home path
                            const stepsIntoHomePath = newPathIndex - homePathEntryIndex;
                            if (stepsIntoHomePath < HOME_PATH_COORDS[currentPlayer.color].length) {
                                canMove = true;
                            }
                        }
                    }
                }
                // Case 3: Piece is on home path
                else if (piece.inHomePath) {
                    const newHomePathIndex = piece.pathIndex + roll; // pathIndex here refers to home path index
                    if (newHomePathIndex < HOME_PATH_COORDS[currentPlayer.color].length) {
                        canMove = true;
                    } else if (newHomePathIndex === HOME_PATH_COORDS[currentPlayer.color].length) {
                        canMove = true; // Can reach home
                    }
                }

                if (canMove) {
                    possibleMoves.push(piece.id);
                }
            });

            setMovablePieces(possibleMoves);

            if (possibleMoves.length === 0) {
                setMessage(`No moves for ${currentPlayer.color}. Next turn.`);
                setTimeout(nextTurn, 1500);
            }
            // Removed the auto-call to handlePieceClick here.
            // The useEffect below will now handle the automatic move if only one piece is movable.
        },
        [players, currentPlayerIndex, piecesPositions, nextTurn]
    );

    const handleRollDice = useCallback(() => {
        if (isRolling || !gameStarted) return;

        setIsRolling(true);
        const roll = Math.floor(Math.random() * 6) + 1;

        // Play dice roll sound
        if (diceRollSoundRef.current) {
            diceRollSoundRef.current.play().catch((e) => console.error('Error playing dice sound:', e));
        }

        // Simulate dice roll animation
        let rollCount = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rollCount++;
            if (rollCount > 10) {
                // Roll for a few times before settling
                clearInterval(interval);
                setDiceValue(roll);
                setIsRolling(false);
                setMessage(`You rolled a ${roll}. Now choose a piece to move.`);
                determineMovablePieces(roll);
            }
        }, 100);
    }, [isRolling, gameStarted, determineMovablePieces]);

    // Effect to automatically move a piece if only one option is available after a dice roll
    useEffect(() => {
        if (gameStarted && movablePieces.length === 1 && diceValue > 0 && !isRolling) {
            // Auto-move the single movable piece after a short delay for visual clarity
            const pieceIdToMove = movablePieces[0];
            setTimeout(() => {
                movePiece(pieceIdToMove, diceValue);
                setSelectedPiece(null);
                setMovablePieces([]);
            }, 500); // Small delay to let the dice animation finish
        }
    }, [movablePieces, diceValue, gameStarted, isRolling, movePiece]);

    // Render the Ludo board cells
    const renderBoardCells = () => {
        const boardCells: JSX.Element[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cellKey = `cell-${row}-${col}`;
                const cellClass = getCellClass(row, col);
                boardCells.push(<div key={cellKey} className={`${CELL_SIZE} ${cellClass}`}></div>);
            }
        }

        return boardCells;
    };

    const isLoading = players.length === 0 && gameStarted === false; // Simple check if game state hasn't been loaded/initialized yet

    if (isLoading) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 text-gray-800 dark:from-gray-900 dark:to-gray-800 dark:text-gray-200'>
                <div className='animate-pulse rounded-lg bg-white p-6 text-xl font-semibold shadow-xl dark:bg-gray-700'>
                    Loading Ludo Game...
                </div>
            </div>
        );
    }

    const currentPlayerColor = players[currentPlayerIndex]?.color || 'gray';

    return (
        <div className='font-inter flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-4 text-gray-800 dark:from-gray-900 dark:to-gray-800 dark:text-gray-200'>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .animate-spin-once {
                    animation: spin 0.5s ease-in-out forwards;
                }
                @keyframes spin {
                    0% { transform: rotateY(0deg); }
                    25% { transform: rotateY(90deg); }
                    50% { transform: rotateY(180deg); }
                    75% { transform: rotateY(270deg); }
                    100% { transform: rotateY(360deg); }
                }
                `}
            </style>

            <h1 className='mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-4xl font-extrabold text-transparent drop-shadow-lg sm:text-5xl'>
                Amazing Ludo!
            </h1>

            <div className='mb-6 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-700'>
                <p className='mb-4 text-center text-lg font-semibold text-gray-700 sm:text-xl dark:text-gray-200'>
                    {message}
                </p>
                <p className='mb-4 text-center text-sm text-gray-500 dark:text-gray-400'>
                    Your User ID: <span className='font-mono break-all text-blue-600 dark:text-blue-400'>{userId}</span>
                </p>
                {!gameStarted ? (
                    <div className='flex justify-center'>
                        <button
                            onClick={initializeGame}
                            className='transform rounded-xl bg-green-600 px-8 py-4 text-xl font-bold text-white shadow-lg transition duration-300 ease-in-out hover:scale-105 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none'>
                            Start New Game
                        </button>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 items-center gap-6 md:grid-cols-3'>
                        {/* Player Info */}
                        <div className='flex flex-col items-center md:col-span-1'>
                            <h2 className='mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100'>Players</h2>
                            {players.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`mb-2 w-full max-w-xs rounded-lg p-3 shadow-md ${currentPlayerIndex === index ? 'bg-blue-200 ring-2 ring-blue-500 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-600'} flex items-center justify-between`}>
                                    <span
                                        className={`text-lg font-semibold capitalize ${player.color === 'red' ? 'text-red-600' : player.color === 'green' ? 'text-green-600' : player.color === 'yellow' ? 'text-yellow-600' : 'text-blue-600'}`}>
                                        {player.color} {player.hasWon && '(Winner!)'}
                                    </span>
                                    <div className='flex -space-x-2 overflow-hidden'>
                                        {piecesPositions[player.color]?.map((piece) => (
                                            // This div represents the small piece icon in the player info section
                                            <div
                                                key={piece.id}
                                                className={`h-6 w-6 rounded-full border-2 border-white shadow-sm ${
                                                    // Directly use baseColorClass for the player info piece icon
                                                    {
                                                        red: 'bg-red-500',
                                                        green: 'bg-green-500',
                                                        yellow: 'bg-yellow-500',
                                                        blue: 'bg-blue-500'
                                                    }[piece.color]
                                                } `}
                                                title={piece.isHome ? 'At Home' : 'In Play'}></div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Dice and Controls */}
                        <div className='flex flex-col items-center justify-center md:col-span-1'>
                            <Dice
                                value={diceValue}
                                onRoll={handleRollDice}
                                isRolling={isRolling}
                                currentPlayerColor={currentPlayerColor}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Ludo Board */}
            <div
                className='relative grid aspect-square w-full max-w-screen-lg gap-0 overflow-hidden rounded-3xl border-4 border-gray-400 dark:border-gray-600'
                ref={boardRef} // Add ref to the board container
                style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`
                }}>
                {/* Render empty cells */}
                {renderBoardCells()}

                {/* Render all pieces separately */}

                {Object.keys(piecesPositions).map((color) =>
                    piecesPositions[color].map((piece) => (
                        <>
                            <LudoPiece
                                key={piece.id}
                                pieceId={piece.id}
                                color={piece.color} // Ensure the color prop is correctly passed
                                targetRow={piece.position.row}
                                targetCol={piece.position.col}
                                cellDimensions={cellDimensions}
                                isMovable={movablePieces.includes(piece.id)}
                                isSelected={selectedPiece === piece.id}
                                onClick={() => handlePieceClick(piece.id)}
                            />
                        </>
                    ))
                )}
            </div>
        </div>
    );
}
