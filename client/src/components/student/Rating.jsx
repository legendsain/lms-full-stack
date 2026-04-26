import React, { useState, useEffect } from 'react';

const Rating = ({ initialRating, onRate }) => {

    const [rating, setRating] = useState(initialRating || 0);
    const [hoverRating, setHoverRating] = useState(0);

    const handleRating = (value) => {
        setRating(value);
        if (onRate) onRate(value);
    };

    useEffect(() => {
        if (initialRating) {
            setRating(initialRating);
        }
    }, [initialRating]);

    return (
        <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        key={index}
                        type="button"
                        className={`text-2xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                            starValue <= (hoverRating || rating) 
                                ? 'text-amber-400 drop-shadow-sm' 
                                : 'text-surface-200'
                        }`}
                        onClick={() => handleRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
};

export default Rating;