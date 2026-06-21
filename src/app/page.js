'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Package } from 'lucide-react';
import styles from './page.module.css';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = searchParams?.get('error');

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleLogin = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  if (status === 'loading') {
    return (
      <div className={styles.loadingScreen}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Animated gradient background */}
      <div className={styles.bgGradient} />

      {/* Floating shapes */}
      <div className={styles.bgShapes} aria-hidden="true">
        <div className={`${styles.shape} ${styles.shape1}`} />
        <div className={`${styles.shape} ${styles.shape2}`} />
        <div className={`${styles.shape} ${styles.shape3}`} />
        <div className={`${styles.shape} ${styles.shape4}`} />
        <div className={`${styles.shape} ${styles.shape5}`} />
        <div className={`${styles.shape} ${styles.shape6}`} />
      </div>

      {/* Login Card */}
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <Package size={30} strokeWidth={2.2} />
          </div>
          <h1 className={styles.title}>SISMA</h1>
          <p className={styles.subtitle}>
            Sistem Inventaris Manajemen Aset Sekolah
          </p>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        <p className={styles.description}>
          Kelola inventaris dan aset sekolah Anda dengan mudah, cepat, dan aman
          dalam satu platform terpadu.
        </p>

        {/* Error Message */}
        {error && (
          <div className={styles.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p>
              {error === 'NotRegistered'
                ? 'Akun Google Anda belum terdaftar dalam sistem SISMA. Hubungi administrator untuk mendaftar.'
                : 'Terjadi kesalahan saat masuk. Silakan coba lagi.'}
            </p>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          className={styles.googleBtn}
          onClick={handleLogin}
          disabled={loading}
          id="google-login-btn"
        >
          {loading ? (
            <div className={styles.btnSpinner} />
          ) : (
            <>
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Masuk dengan Google
            </>
          )}
        </button>

        <p className={styles.footer}>
          Hanya akun yang terdaftar di sistem SISMA yang dapat mengakses
          aplikasi ini.
        </p>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureDot} style={{ background: '#38a169' }} />
            <span>Manajemen Aset</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureDot} style={{ background: '#3182ce' }} />
            <span>Peminjaman</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureDot} style={{ background: '#dd6b20' }} />
            <span>Perbaikan</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureDot} style={{ background: '#805ad5' }} />
            <span>Laporan</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingScreen}>
          <div className="spinner" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
