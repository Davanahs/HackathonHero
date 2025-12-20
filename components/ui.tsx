
import React from 'react';

// --- Animated Manual-AI Cat Robot ---
export const CatRobot = ({ size = 'normal' }: { size?: 'normal' | 'compact' }) => {
  const containerClass = size === 'normal' ? "w-24 h-24 mx-auto mb-2" : "w-12 h-12 mx-auto mb-1";
  return (
    <div className={`relative ${containerClass}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .robot-float { animation: float 4s ease-in-out infinite; }
        .robot-eyes { transform-origin: center; animation: blink 4s infinite; }
      `}} />
      <svg viewBox="0 0 100 100" className="w-full h-full robot-float drop-shadow-xl">
        <rect x="20" y="30" width="60" height="50" rx="12" fill="#FFFFFF" stroke="#475569" strokeWidth="2.5" />
        <path d="M25 30 L35 15 L45 30" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <path d="M75 30 L65 15 L55 30" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <rect x="28" y="40" width="44" height="30" rx="6" fill="#DCD6F7" />
        <g className="robot-eyes">
          <circle cx="40" cy="52" r="3.5" fill="#475569" />
          <circle cx="60" cy="52" r="3.5" fill="#475569" />
        </g>
        <path d="M45 62 Q50 66 55 62" stroke="#475569" strokeWidth="2" fill="none" />
        <line x1="50" y1="30" x2="50" y2="10" stroke="#475569" strokeWidth="2" />
        <circle cx="50" cy="8" r="4" fill="#A696E7" className="animate-pulse" />
      </svg>
    </div>
  );
};

// --- Standard Icons ---
export const Icons = {
  Rocket: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  Map: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 21 15 18 9 21 3 18 3 6"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="6" y2="18"/></svg>,
  Mic: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Code: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 0-1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
};

// --- Custom UI Components ---
export const Button = ({ children, onClick, className = '', variant = 'primary', isLoading = false, disabled = false, ...props }: any) => {
  const base = "px-6 py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-[#A696E7] text-white hover:bg-[#8B7EDC] shadow-lg shadow-indigo-200",
    secondary: "bg-white text-slate-800 border-2 border-slate-100 hover:border-[#A696E7]",
    outline: "bg-transparent border-2 border-[#A696E7] text-[#A696E7] hover:bg-[#A696E7] hover:text-white"
  };
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? (
        <span className="flex items-center gap-2 animate-pulse">
          <Icons.Sparkles /> Thinking...
        </span>
      ) : children}
    </button>
  );
};

export const Card = ({ title, children, className = '' }: any) => (
  <div className={`bg-white/80 backdrop-blur-md rounded-[2.5rem] p-10 shadow-2xl border border-white/50 ${className}`}>
    {title && <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">{title}</h3>}
    {children}
  </div>
);

export const Input = ({ value, onChange, placeholder, className = '', ...props }: any) => (
  <input 
    type="text" 
    value={value} 
    onChange={onChange} 
    placeholder={placeholder}
    className={`w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-[#A696E7] focus:ring-0 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300 ${className}`}
    {...props}
  />
);

export const Textarea = ({ value, onChange, placeholder, className = '', ...props }: any) => (
  <textarea 
    value={value} 
    onChange={onChange} 
    placeholder={placeholder}
    className={`w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-[#A696E7] focus:ring-0 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300 min-h-[120px] ${className}`}
    {...props}
  />
);

export const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2 text-slate-400 hover:text-[#A696E7] font-bold text-xs uppercase tracking-widest mb-8 transition-colors group">
    <div className="group-hover:-translate-x-1 transition-transform"><Icons.ArrowLeft /></div>
    <span>Return</span>
  </button>
);
