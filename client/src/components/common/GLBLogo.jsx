import React from 'react';

/**
 * GLBLogo Component
 * Clean, text-based institutional brand mark for:
 * GL BAJAJ GROUP OF INSTITUTIONS, MATHURA
 * 
 * Reusable for future official PNG/SVG image replacement:
 * If an official image asset is available, pass it via `src` or place it at `client/public/glbajaj-logo.png`.
 */
export const GLBLogo = ({ 
  size = 'md', 
  variant = 'full', // 'full' | 'mark' | 'compact'
  theme = 'dark', // 'dark' (default for dark portal) | 'light'
  className = '',
  src = null, 
}) => {
  // If official logo image is passed or configured
  if (src) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <img 
          src={src} 
          alt="GL Bajaj Group of Institutions, Mathura" 
          className={`object-contain ${
            size === 'sm' ? 'h-7' : size === 'lg' ? 'h-12' : 'h-9'
          }`}
        />
        {variant !== 'mark' && (
          <div className="flex flex-col text-left">
            <span className={`font-bold tracking-tight leading-none ${
              theme === 'light' ? 'text-slate-900' : 'text-[#E6EDF3]'
            } ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
              GL BAJAJ
            </span>
            <span className={`text-[10px] tracking-wider uppercase font-semibold leading-tight ${
              theme === 'light' ? 'text-blue-900' : 'text-sky-400'
            }`}>
              Group of Institutions, Mathura
            </span>
          </div>
        )}
      </div>
    );
  }

  // Clean, professional text-based institutional brand mark
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-0.5 text-xs tracking-wider',
      title: 'text-xs',
      sub: 'text-[9px]',
      gap: 'gap-2.5',
    },
    md: {
      badge: 'px-2.5 py-1 text-sm tracking-wider',
      title: 'text-sm',
      sub: 'text-[10px]',
      gap: 'gap-3',
    },
    lg: {
      badge: 'px-3 py-1.5 text-base tracking-widest',
      title: 'text-base',
      sub: 'text-xs',
      gap: 'gap-3.5',
    },
  }[size] || {
    badge: 'px-2.5 py-1 text-sm tracking-wider',
    title: 'text-sm',
    sub: 'text-[10px]',
    gap: 'gap-3',
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${className}`}>
      {/* Clean text-based institutional badge mark */}
      <div 
        className={`${sizeClasses.badge} font-black font-mono rounded-lg border select-none transition-colors ${
          theme === 'light'
            ? 'bg-blue-900 text-white border-blue-800'
            : 'bg-[#151922] text-sky-400 border-slate-700/80'
        }`}
        title="GL Bajaj Group of Institutions, Mathura"
      >
        GLB
      </div>

      {variant !== 'mark' && (
        <div className="flex flex-col text-left">
          <span 
            className={`font-black tracking-tight uppercase leading-none font-sans ${
              theme === 'light' ? 'text-slate-900' : 'text-[#E6EDF3]'
            } ${sizeClasses.title}`}
          >
            GL BAJAJ
          </span>
          <span 
            className={`font-semibold tracking-wider uppercase leading-tight font-sans mt-0.5 ${
              theme === 'light' ? 'text-blue-800' : 'text-slate-400'
            } ${sizeClasses.sub}`}
          >
            Group of Institutions, Mathura
          </span>
        </div>
      )}
    </div>
  );
};

export default GLBLogo;
