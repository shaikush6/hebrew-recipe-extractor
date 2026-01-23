'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Show success message (email confirmation may be required depending on Supabase settings)
    setSuccess(true);
    setLoading(false);

    // Auto-redirect after success (if email confirmation is disabled)
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 2000);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-olive-100 mb-4">
            <CheckCircle className="w-8 h-8 text-olive-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal mb-2">
            נרשמת בהצלחה!
          </h1>
          <p className="text-charcoal/60 mb-6">
            מעביר אותך לעמוד הראשי...
          </p>
          <Link
            href="/"
            className="text-terracotta-600 hover:text-terracotta-700 font-medium"
          >
            לחץ כאן אם אתה לא מועבר אוטומטית
          </Link>
        </div>
      </div>
    );
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
            צור חשבון חדש
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
                שם (אופציונלי)
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="השם שלך"
                  className="w-full pr-11 pl-4 py-3 rounded-lg border border-cream-dark bg-cream/50
                           focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400
                           text-charcoal placeholder:text-charcoal/40"
                />
              </div>
            </div>

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
                  placeholder="לפחות 8 תווים"
                  required
                  minLength={8}
                  dir="ltr"
                  className="w-full pr-11 pl-4 py-3 rounded-lg border border-cream-dark bg-cream/50
                           focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400
                           text-charcoal placeholder:text-charcoal/40"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-2">
                אימות סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הקלד שוב את הסיסמה"
                  required
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
                  יוצר חשבון...
                </>
              ) : (
                'הירשם'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-charcoal/60">
            כבר יש לך חשבון?{' '}
            <Link
              href="/auth/login"
              className="text-terracotta-600 hover:text-terracotta-700 font-medium"
            >
              התחבר
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
