'use client';

import { useEffect, useState } from 'react';
import { Card } from '../context/GameContext';

interface Card2DProps {
    card: Card;
    onClick: () => void;
    difficulty: string;
}

export default function Card2D({ card, onClick, difficulty }: Card2DProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Get card color based on difficulty
    const getCardColor = () => {
        switch (difficulty) {
            case 'easy':
                return 'var(--neon-cyan)'; // Cyan
            case 'medium':
                return 'var(--neon-green)'; // Green
            case 'hard':
                return 'var(--neon-pink)'; // Magenta
            case 'tough':
                return 'var(--neon-purple)'; // Purple
            case 'genius':
                // For genius level, create very subtle color variations
                // We'll use a base purple and adjust opacity/brightness in CSS if needed
                return 'var(--neon-purple)';
            default:
                return 'var(--neon-cyan)';
        }
    };

    // Get card symbol or value
    const getCardSymbol = () => {
        if (difficulty === 'genius') {
            // For genius level, don't show symbols, just rely on subtle color differences
            // We might need a different visual cue for 2D genius mode if color variation is too subtle
            // For now, let's stick to the 3D logic but maybe add a small indicator
            return '';
        }

        // For other difficulties, use emojis grouped by category
        const emojis = [
            // Animals
            '🐶', '🐱', '🐭', '🦊', '🐻', '🐼', '🦁', '🐯', '🦄', '🐝',
            '🦋', '🐢', '🐙', '🦈', '🦜', '🦉', '🦧', '🐘', '🦒', '🦏',
            // Fruits & Food
            '🍎', '🍌', '🍉', '🍇', '🍓', '🍍', '🥑', '🍔', '🍕', '🍦',
            '🌮', '🍣', '🥨', '🍩', '🥐', '🧁', '🍭', '🍫', '🥥', '🍪',
            // Vehicles & Travel
            '🚗', '🚕', '🚙', '🚌', '🚑', '🏎️', '🚂', '🚀', '✈️', '🛸',
            '🚁', '⛵', '🚤', '🚲', '🛴', '🏍️', '🚄', '🚞', '🚠', '🚇',
            // Objects & Activities
            '⚽', '🏀', '🏈', '⚾', '🎾', '🎮', '🎲', '🧩', '🎸', '🎺',
            '🔮', '💎', '🔑', '🧸', '🎁', '💼', '📱', '⌚', '🔋', '💡'
        ];

        return emojis[card.value % emojis.length];
    };

    const cardColor = getCardColor();
    const isFlippedOrMatched = card.isFlipped || card.isMatched;

    return (
        <div
            className={`relative w-full aspect-[3/4] cursor-pointer perspective-1000`}
            onClick={!isFlippedOrMatched ? onClick : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`w-full h-full transition-all duration-500 transform-style-3d ${isFlippedOrMatched ? 'rotate-y-180' : ''
                    } ${isHovered && !isFlippedOrMatched ? 'scale-105' : ''}`}
            >
                {/* Card Back (Front Face) */}
                <div
                    className="absolute w-full h-full backface-hidden rounded-xl border-2 flex items-center justify-center overflow-hidden bg-black"
                    style={{
                        borderColor: cardColor,
                        boxShadow: isHovered ? `0 0 15px ${cardColor}` : `0 0 5px ${cardColor}`,
                    }}
                >
                    {/* Cyber pattern background */}
                    <div className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `radial-gradient(circle at 50% 50%, ${cardColor} 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }}
                    />
                    <div className="text-4xl opacity-50">?</div>
                </div>

                {/* Card Front (Back Face) */}
                <div
                    className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl border-2 flex items-center justify-center bg-gray-900"
                    style={{
                        borderColor: cardColor,
                        boxShadow: card.isMatched
                            ? `0 0 20px ${cardColor}, inset 0 0 20px ${cardColor}`
                            : `0 0 10px ${cardColor}`,
                    }}
                >
                    <div className="text-5xl select-none filter drop-shadow-lg">
                        {getCardSymbol()}
                    </div>

                    {/* Genius mode subtle variation indicator if needed */}
                    {difficulty === 'genius' && (
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{ backgroundColor: cardColor }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
