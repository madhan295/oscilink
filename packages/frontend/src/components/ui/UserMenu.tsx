import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { LogOut, Settings, FolderOpen } from 'lucide-react';
import { Button } from './Button';

export function UserMenu() {
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { setAuthModalOpen, setMyProjectsOpen } = useUiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <Button 
        variant="primary" 
        size="sm" 
        onClick={() => setAuthModalOpen(true)}
        className="font-medium px-4 shadow-sm"
      >
        Sign In
      </Button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const email = user.email;
  const initials = email ? email.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle bg-gradient-to-br from-accent-blue to-purple-600 text-white font-semibold text-xs shadow-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-1 focus:ring-offset-surface"
      >
        {avatarUrl && !imgError ? (
          <img 
            src={avatarUrl} 
            alt="User Avatar" 
            className="w-full h-full rounded-full object-cover" 
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-elevated border border-border-default z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-border-default bg-surface">
            <p className="text-sm font-medium text-text-primary truncate">Account</p>
            <p className="text-xs text-text-muted truncate mt-0.5" title={email}>{email}</p>
          </div>
          
          <div className="py-1">
            <button 
              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors flex items-center gap-2"
              onClick={() => { 
                setIsOpen(false);
                setMyProjectsOpen(true);
              }}
            >
              <FolderOpen size={14} />
              My Projects
            </button>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors flex items-center gap-2"
              onClick={() => { setIsOpen(false); /* handle settings */ }}
            >
              <Settings size={14} />
              Settings
            </button>
          </div>
          
          <div className="py-1 border-t border-border-default">
            <button 
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface-hover transition-colors flex items-center gap-2"
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
