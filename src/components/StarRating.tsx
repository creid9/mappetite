interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'text-lg' : 'text-2xl';

  return (
    <div className={`flex gap-0.5 ${readonly ? '' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${sizeClass} transition-colors disabled:cursor-default ${
            star <= rating ? 'text-yellow-400' : 'text-gray-600'
          } ${!readonly ? 'hover:text-yellow-300' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
