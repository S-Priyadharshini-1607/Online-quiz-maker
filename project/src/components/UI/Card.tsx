import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 ${
        hover ? 'hover:shadow-xl hover:scale-105 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}