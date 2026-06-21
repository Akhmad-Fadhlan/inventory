'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import styles from './layout.module.css';

// Map pathname to user-friendly titles in Bahasa Indonesia
const getPageTitle = (pathname) => {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/assets') return 'Manajemen Aset';
  if (pathname.startsWith('/assets/')) return 'Detail Aset';
  if (pathname === '/borrowings') return 'Peminjaman Aset';
  if (pathname === '/maintenance') return 'Manajemen Perbaikan';
  if (pathname === '/inspections') return 'Inspeksi Aset';
  if (pathname === '/transfers') return 'Transfer Aset';
  if (pathname === '/reports') return 'Laporan & Ekspor';
  return 'SISMA';
};

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync collapsed state with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sisma-sidebar-collapsed');
    if (saved === 'true') {
      setSidebarCollapsed(true);
    }
    setMounted(true);
  }, []);

  const handleSetCollapsed = (value) => {
    setSidebarCollapsed(value);
    localStorage.setItem('sisma-sidebar-collapsed', value ? 'true' : 'false');
  };

  if (!mounted) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className={`${styles.layoutContainer} ${sidebarCollapsed ? 'collapsed-layout' : ''}`}>
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={handleSetCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Side */}
      <div 
        className={[
          styles.mainArea,
          sidebarCollapsed ? styles.mainAreaCollapsed : ''
        ].filter(Boolean).join(' ')}
      >
        {/* Topbar */}
        <Topbar 
          title={pageTitle} 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Content View */}
        <main className={styles.content}>
          <div className="page-content animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
