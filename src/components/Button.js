import React from 'react';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  icon = null,
  children,
  fullWidth = false,
  type = 'button',
  className = ''
}) {
  const buttonClass = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loadingState : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <span
          className="spinner spinner-sm"
          style={{
            borderTopColor: 'currentColor',
            display: 'inline-block',
            verticalAlign: 'middle',
            marginRight: '8px'
          }}
        />
      )}
      {!loading && icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
    </button>
  );
}
