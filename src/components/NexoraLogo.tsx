import React from 'react';

interface NexoraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const NexoraLogo: React.FC<NexoraLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textDimensions = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Electric Blue & Pure Black Emblem SVG */}
      <div className={`relative ${iconDimensions[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_14px_rgba(37,99,235,0.45)]"
        >
          <defs>
            <linearGradient id="nexoraBlueGrad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="35%" stopColor="#38BDF8" />
              <stop offset="70%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <linearGradient id="nexoraBlueGrad2" x1="90" y1="10" x2="10" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="40%" stopColor="#0066FF" />
              <stop offset="75%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Background Pure Black Radial Disc */}
          <circle cx="50" cy="50" r="46" fill="#030712" stroke="#1E3A8A" strokeWidth="1.5" />

          {/* North-South Neural Loop */}
          <path
            d="M50 18 C32 30, 24 50, 50 82 C76 50, 68 30, 50 18 Z"
            stroke="url(#nexoraBlueGrad1)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.95"
          />

          {/* East-West Neural Loop */}
          <path
            d="M18 50 C30 32, 50 24, 82 50 C50 76, 30 68, 18 50 Z"
            stroke="url(#nexoraBlueGrad2)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.95"
          />

          {/* Interlocking Diamond Strands */}
          <path
            d="M24 24 L76 76 M76 24 L24 76"
            stroke="url(#nexoraBlueGrad1)"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Outer Vertex Node Dots */}
          <circle cx="50" cy="18" r="4" fill="#FFFFFF" stroke="#0066FF" strokeWidth="2" />
          <circle cx="82" cy="50" r="4" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
          <circle cx="50" cy="82" r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
          <circle cx="18" cy="50" r="4" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="2" />

          {/* Diagonal Secondary Quantum Nodes */}
          <circle cx="28" cy="28" r="3.2" fill="#38BDF8" />
          <circle cx="72" cy="28" r="3.2" fill="#60A5FA" />
          <circle cx="72" cy="72" r="3.2" fill="#0066FF" />
          <circle cx="28" cy="72" r="3.2" fill="#22D3EE" />

          {/* Central Knot Node with Electric Blue Glow */}
          <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" stroke="#0066FF" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Logotype Text */}
      {showText && (
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-wider text-white ${textDimensions[size]}`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              NEXORA
            </span>
            <span
              className={`font-black tracking-wider bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent ${textDimensions[size]}`}
            >
              AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
