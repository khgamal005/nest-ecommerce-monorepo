// Ratings.tsx - Simple version
import React from 'react';
import { Star } from 'lucide-react';

interface RatingsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showNumber?: boolean;
  className?: string;
}

const Ratings: React.FC<RatingsProps> = ({
  rating,
  maxStars = 5,
  size = 20,
  showNumber = false,
  className = ''
}) => {
  const clampedRating = Math.min(Math.max(rating, 0), maxStars);
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          let fillPercentage = 0;
          
          if (clampedRating >= starValue) {
            fillPercentage = 100;
          } else if (clampedRating > starValue - 1) {
            fillPercentage = (clampedRating - (starValue - 1)) * 100;
          }
          
          return (
            <div key={index} className="relative" style={{ width: size, height: size }}>
              {/* Empty star */}
              <Star
                size={size}
                className="absolute top-0 left-0 text-gray-300"
                fill="#d1d5db"
              />
              
              {/* Filled portion */}
              {fillPercentage > 0 && (
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ 
                    width: `${fillPercentage}%`,
                    height: size
                  }}
                >
                  <Star
                    size={size}
                    className="text-yellow-400"
                    fill="#fbbf24"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {showNumber && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default Ratings;