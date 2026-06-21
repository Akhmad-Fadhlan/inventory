import React from 'react';
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action = null
}) {
  return (
    <div className={`${styles.container} animate-fade-in`}>
      {Icon && (
        <div className={styles.iconWrapper}>
          <Icon size={40} className={styles.icon} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
