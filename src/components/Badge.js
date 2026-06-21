import React from 'react';
import styles from './Badge.module.css';

export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = ''
}) {
  const badgeClass = [
    styles.badge,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClass}>
      {children}
    </span>
  );
}
