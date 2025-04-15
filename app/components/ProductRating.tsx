'use client';

import { FiStar } from 'react-icons/fi';

interface ProductRatingProps {
  rating: number;
  reviewCount: number;
  isAnimating?: boolean;
}

export default function ProductRating({ rating, reviewCount, isAnimating = false }: ProductRatingProps) {
  // Arredondar a avaliação para visualização
  const displayRating = rating.toFixed(1);
  
  return (
    <div className="flex items-center mt-1 mb-2">
      <div className="flex items-center">
        <div className="text-amber-400 flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <FiStar 
              key={star} 
              className={`${star <= Math.round(rating) ? 'fill-current' : 'text-amber-400/30'} ${
                isAnimating && star <= Math.round(rating) ? 'animate-pulse scale-110 duration-300' : ''
              } transition-all`} 
              size={14}
            />
          ))}
        </div>
        <span className={`ml-2 text-sm rating-value ${isAnimating ? 'animate-pulse text-amber-400 font-medium' : 'text-gray-300'}`}>
          <span className="font-bold">{displayRating}</span> 
          <span className="text-gray-400">({reviewCount} avaliações)</span>
        </span>
      </div>
    </div>
  );
} 