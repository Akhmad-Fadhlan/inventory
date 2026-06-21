'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// === Theme Context ===
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// === Toast Context ===
const ToastContext = createContext({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => onRemove(toast.id)}
          role="alert"
        >
          <strong style={{ display: 'block', marginBottom: '2px' }}>{toast.title || (toast.type === 'error' ? 'Error' : 'Info')}</strong>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// === Main Providers ===
export default function Providers({ children }) {
  const [theme, setTheme] = useState('light');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sisma-theme') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('sisma-theme', next);
      return next;
    });
  }, []);

  const showToast = useCallback((message, type = 'success', title = '') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <ToastContext.Provider value={{ showToast }}>
          {children}
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
      </ThemeContext.Provider>
    </SessionProvider>
  );
}
