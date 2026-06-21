import React from 'react';
import styles from './StatsCard.module.css';

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  loading = false,
  delay = '0s'
}) {
  if (loading) {
    return (
      <div 
        className={`${styles.card} ${styles.loading}`}
        style={{ animationDelay: delay }}
      >
        <div className={styles.loadingHeader}>
          <div className="skeleton" style={{ width: '60%', height: '16px' }} />
          <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        </div>
        <div className="skeleton" style={{ width: '40%', height: '32px', marginTop: '12px' }} />
        {subtitle !== undefined && (
          <div className="skeleton" style={{ width: '70%', height: '12px', marginTop: '8px' }} />
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${styles.card} animate-slide-up`}
      style={{ animationDelay: delay }}
    >
      <div className={styles.cardContent}>
        <div className={styles.textContainer}>
          <span className={styles.title}>{title}</span>
          <span className={styles.value}>{value}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {Icon && (
          <div className={`${styles.iconContainer} ${styles[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
