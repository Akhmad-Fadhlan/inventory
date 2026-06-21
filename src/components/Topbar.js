'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/Providers';
import { Menu, Moon, Sun, Bell, User } from 'lucide-react';
import styles from './Topbar.module.css';

export default function Topbar({
  title = 'SISMA',
  onMenuClick
}) {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  const userName = session?.user?.name || 'User';

  return (
    <header className={styles.topbar}>
      {/* Left: Mobile hamburger & title */}
      <div className={styles.leftSection}>
        <button 
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      {/* Right: Actions & Profile */}
      <div className={styles.rightSection}>
        {/* Dark Mode Toggle */}
        <button 
          className={styles.actionBtn}
          onClick={toggleTheme}
          title={theme === 'light' ? 'Ubah ke mode gelap' : 'Ubah ke mode terang'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications (aesthetic only for now) */}
        <button 
          className={styles.actionBtn} 
          title="Notifikasi"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        {/* User profile details */}
        <div className={styles.divider} />
        
        <div className={styles.profile}>
          <span className={styles.userName}>{userName}</span>
          <div className={styles.avatar}>
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt={userName} 
                className={styles.avatarImg}
              />
            ) : (
              <User size={18} className={styles.avatarIcon} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
