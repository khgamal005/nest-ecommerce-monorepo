import React from 'react';

interface TitleBorderProps {
  className?: string;
}

const TitleBorder: React.FC<TitleBorderProps> = ({ className = '' }) => {
  return (
    <svg
      className={className}
      width="280"
      height="10"
      viewBox="0 0 280 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="4" width="180" height="2" rx="1" fill="#3B82F6" fillOpacity="0.3" />
      <path
        d="M180 5 C200 -4 240 14 260 5 L280 5"
        stroke="url(#titleBorderGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient id="titleBorderGradient" x1="180" y1="5" x2="280" y2="5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default TitleBorder;
