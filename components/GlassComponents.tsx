import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Base Glass Card
export const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`backdrop-blur-md bg-white/40 border border-white/50 shadow-xl rounded-2xl p-6 relative overflow-hidden ${className}`}>
      {/* Subtle reflection effect */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

// Glass Button
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'neutral';
}

export const GlassButton: React.FC<GlassButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  let colorClass = '';
  switch (variant) {
    case 'primary':
      colorClass = 'bg-sky-400/80 hover:bg-sky-400 text-white shadow-sky-200/50';
      break;
    case 'danger':
      colorClass = 'bg-rose-400/80 hover:bg-rose-400 text-white shadow-rose-200/50';
      break;
    case 'success':
      colorClass = 'bg-emerald-400/80 hover:bg-emerald-400 text-white shadow-emerald-200/50';
      break;
    case 'neutral':
      colorClass = 'bg-white/50 hover:bg-white/70 text-slate-600 shadow-slate-200/50';
      break;
  }

  return (
    <button
      className={`relative backdrop-blur-sm border border-white/30 shadow-lg rounded-xl px-6 py-3 font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${colorClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Glass Input
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    transparent?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({ transparent, className = '', ...props }) => {
  const bgClass = transparent ? 'bg-transparent focus:bg-transparent' : 'bg-white/50 focus:bg-white/70';
  
  return (
    <input
      className={`w-full ${bgClass} backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all ${className}`}
      {...props}
    />
  );
};

export const GlassSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  return (
    <select
      className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white/70 transition-all appearance-none cursor-pointer"
      {...props}
    >
      {props.children}
    </select>
  );
};

// Badge
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = 'bg-gray-100/50 text-gray-600 border-gray-200';
  if (status === 'Onaylandı') colorClass = 'bg-emerald-100/60 text-emerald-700 border-emerald-200';
  if (status === 'Reddedildi') colorClass = 'bg-rose-100/60 text-rose-700 border-rose-200';
  if (status === 'Beklemede') colorClass = 'bg-sky-100/60 text-sky-700 border-sky-200';

  return (
    <span className={`backdrop-blur-sm border px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
};

// User Avatar (Initials)
interface UserAvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = 'md', className = '' }) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    let sizeClass = 'w-10 h-10 text-sm';
    if (size === 'sm') sizeClass = 'w-8 h-8 text-xs';
    if (size === 'lg') sizeClass = 'w-14 h-14 text-lg';
    if (size === 'xl') sizeClass = 'w-24 h-24 text-3xl';

    // Generate a consistent random-ish gradient based on name length
    const gradients = [
        'from-sky-400 to-indigo-500',
        'from-emerald-400 to-teal-500',
        'from-rose-400 to-pink-500',
        'from-amber-400 to-orange-500',
        'from-violet-400 to-purple-500'
    ];
    const gradientIndex = name.length % gradients.length;
    const gradientClass = gradients[gradientIndex];

    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold shadow-md border-2 border-white ${className}`}>
            {initials}
        </div>
    );
};

// Confirmation Modal
interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, title, message, onConfirm, onCancel, confirmText = "Sil", cancelText = "Vazgeç" 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
            <GlassCard className="w-full max-w-sm !p-0 overflow-hidden shadow-2xl">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
                </div>
                <div className="flex border-t border-slate-100">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-4 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <div className="w-px bg-slate-100"></div>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
