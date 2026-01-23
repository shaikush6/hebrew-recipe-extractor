'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for callback errors
  const callbackError = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Redirect to home on success
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terracotta-100 mb-4">
            <ChefHat className="w-8 h-8 text-terracotta-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-charcoal">
            Recipe Extractor
          </h1>
          <p className="text-charcoal/60 mt-2">
            התחבר לחשבון שלך
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Error Messages */}
          {(error || callbackError) && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">
                {error || 'אירעה שגיאה בהתחברות. נסה שוב.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  dir="ltr"
                  className="w-full pr-11 pl-4 py-3 rounded-lg border border-cream-dark bg-cream/50
                           focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400
                           text-charcoal placeholder:text-charcoal/40"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  dir="ltr"
                  className="w-full pr-11 pl-4 py-3 rounded-lg border border-cream-dark bg-cream/50
                           focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400
                           text-charcoal placeholder:text-charcoal/40"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-terracotta-500 text-white font-medium
                       hover:bg-terracotta-600 focus:outline-none focus:ring-4 focus:ring-terracotta-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  מתחבר...
                </>
              ) : (
                'התחבר'
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-charcoal/60">
            אין לך חשבון?{' '}
            <Link
              href="/auth/register"
              className="text-terracotta-600 hover:text-terracotta-700 font-medium"
            >
              הירשם עכשיו
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-charcoal/60 hover:text-charcoal text-sm"
          >
            ← חזרה לעמוד הראשי
          </Link>
        </p>
      </div>
    </div>
  );
}
