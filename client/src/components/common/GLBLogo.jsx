import React from 'react';

/**
 * GLBLogo Component
 * Official Branding for GL BAJAJ GROUP OF INSTITUTIONS, MATHURA
 * 
 * NOTE FOR INSTITUTION ADMINISTRATORS:
 * When the official PNG/SVG logo file is available:
 * 1. Place it in `client/public/glbajaj-logo.png`
 * 2. Set the `officialLogoUrl` below or pass it via the `src` prop.
 */
export const GLBLogo = ({ 
  size = 'md', 
  variant = 'full', // 'full' | 'mark' | 'compact'
  theme = 'light', // 'light' | 'dark'
  className = '',
  src = null, // Custom image URL if available
}) => {
  // If an official image asset is passed or found in public
  if (src) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <img 
          src={src} 
          alt="GL Bajaj Group of Institutions, Mathura" 
          className={`object-contain ${
            size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-10'
          }`}
        />
        {variant !== 'mark' && (
          <div className="flex flex-col">
            <span className={`font-bold tracking-tight leading-none ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            } ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
              GL BAJAJ
            </span>
            <span className={`text-[10px] tracking-wider uppercase font-semibold leading-tight ${
              theme === 'dark' ? 'text-sky-300' : 'text-blue-900'
            }`}>
              Group of Institutions, Mathura
            </span>
          </div>
        )}
      </div>
    );
  }

  // High-fidelity Institutional Crest Placeholder
  const sizeClasses = {
    sm: {
      crest: 'w-8 h-8 text-[10px]',
      title: 'text-xs',
      sub: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      crest: 'w-10 h-10 text-xs',
      title: 'text-sm',
      sub: 'text-[10px]',
      gap: 'gap-3',
    },
    lg: {
      crest: 'w-14 h-14 text-sm',
      title: 'text-base',
      sub: 'text-xs',
      gap: 'gap-3.5',
    },
  }[size] || {
    crest: 'w-10 h-10 text-xs',
    title: 'text-sm',
    sub: 'text-[10px]',
    gap: 'gap-3',
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${className}`}>
      {/* College Heraldic Monogram Crest */}
      <div 
        className={`${sizeClasses.crest} relative flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 flex items-center justify-center text-white font-extrabold shadow-md border border-blue-700/50 select-none`}
        title="GL Bajaj Group of Institutions, Mathura"
      >
        <span className="tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-amber-200 via-amber-100 to-amber-300 font-serif">
          GLB
        </span>
        {/* Subtle decorative crest ring */}
        <div className="absolute inset-0.5 rounded-[10px] border border-amber-300/30 pointer-events-none" />
      </div>

      {variant !== 'mark' && (
        <div className="flex flex-col text-left">
          <span 
            className={`font-extrabold tracking-tight uppercase leading-none font-sans ${
              theme === 'dark' ? 'text-white' : 'text-blue-950'
            } ${sizeClasses.title}`}
          >
            GL BAJAJ
          </span>
          <span 
            className={`font-semibold tracking-wider uppercase leading-tight font-sans ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
            } ${sizeClasses.sub}`}
          >
            Group of Institutions, Mathura
          </span>
          {size === 'lg' && (
            <span className={`text-[9px] font-medium leading-none mt-0.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Approved by AICTE • Affiliated to AKTU
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GLBLogo;
