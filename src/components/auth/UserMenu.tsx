'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, ChefHat, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface UserMenuProps {
  isHebrew?: boolean;
}

export function UserMenu({ isHebrew = false }: UserMenuProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { email: user.email || '' } : null);
      setIsLoading(false);
    }
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? { email: session.user.email || '' } : null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="p-2">
        <Loader2 className="w-5 h-5 animate-spin text-charcoal/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            "text-charcoal hover:bg-cream-dark"
          )}
        >
          {isHebrew ? 'התחברות' : 'Login'}
        </Link>
        <Link
          href="/auth/register"
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            "bg-terracotta-500 text-white hover:bg-terracotta-600"
          )}
        >
          {isHebrew ? 'הרשמה' : 'Sign Up'}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          "hover:bg-cream-dark",
          isOpen && "bg-cream-dark"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={isHebrew ? 'תפריט משתמש' : 'User menu'}
      >
        <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center">
          <User className="w-4 h-4 text-terracotta-600" />
        </div>
        <span className="text-sm font-medium text-charcoal max-w-[120px] truncate hidden sm:block">
          {user.email}
        </span>
      </button>

      {isOpen && (
        <div
          className={clsx(
            "absolute top-full mt-2 w-56 py-2 bg-white rounded-xl shadow-lg border border-cream-dark",
            "animate-in fade-in slide-in-from-top-2 duration-200",
            isHebrew ? "left-0" : "right-0"
          )}
          role="menu"
        >
          <div className="px-4 py-2 border-b border-cream-dark">
            <p className="text-sm text-charcoal/60">
              {isHebrew ? 'מחובר בתור' : 'Signed in as'}
            </p>
            <p className="text-sm font-medium text-charcoal truncate">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-charcoal hover:bg-cream-dark transition-colors"
              role="menuitem"
            >
              <ChefHat className="w-4 h-4" />
              {isHebrew ? 'המתכונים שלי' : 'My Recipes'}
            </Link>
          </div>

          <div className="border-t border-cream-dark pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              {isHebrew ? 'התנתקות' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
