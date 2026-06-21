import React from 'react';
import styles from './ChartCard.module.css';

export default function ChartCard({
  title,
  subtitle,
  children,
  loading = false
}) {
  return (
    <div className={`${styles.card} animate-slide-up`}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      <div className={styles.body}>
        {loading ? (
          <div className={`${styles.skeletonContainer}`}>
            <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--rounded-md)' }} />
          </div>
        ) : (
          <div className={styles.chartWrapper}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
