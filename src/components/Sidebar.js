'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  Truck,
  FileBarChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { NAV_ITEMS, ROLE_LABELS } from '@/lib/constants';
import styles from './Sidebar.module.css';

// Map icon string names to components
const iconMap = {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  Truck,
  FileBarChart,
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = session?.user?.role;
  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';

  // Filter navigation items by role
  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const handleLinkClick = () => {
    // Close sidebar on mobile after clicking link
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const getRoleLabel = (role) => {
    return ROLE_LABELS[role] || role;
  };

  return (
    <>
      {/* Mobile Overlay backdrop */}
      {mobileOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={[
          styles.sidebar,
          collapsed ? styles.collapsed : '',
          mobileOpen ? styles.mobileOpen : ''
        ].filter(Boolean).join(' ')}
      >
        {/* Top Logo Area */}
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <Package size={28} className={styles.logoIcon} />
            {!collapsed && <span className={styles.logoText}>SISMA</span>}
          </div>
          <button 
            className={styles.toggleBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={styles.nav}>
          {filteredItems.map((item) => {
            const IconComponent = iconMap[item.icon] || Package;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <IconComponent size={20} className={styles.navIcon} />
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={userName} 
                  className={styles.avatarImg}
                />
              ) : (
                <User size={20} className={styles.avatarIcon} />
              )}
            </div>
            {!collapsed && (
              <div className={styles.userText}>
                <span className={styles.userName} title={userName}>{userName}</span>
                <span className={styles.userRoleBadge}>
                  {getRoleLabel(userRole)}
                </span>
              </div>
            )}
          </div>

          <button 
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/' })}
            title={collapsed ? "Keluar" : undefined}
          >
            <LogOut size={20} className={styles.logoutIcon} />
            {!collapsed && <span className={styles.logoutLabel}>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
