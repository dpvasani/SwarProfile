import React, { createContext, useContext, useState, useCallback } from 'react';

const NotifyContext = createContext(null);

export const NotifyProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    setToasts((t) => [...t, { id, ...toast }]);
    if (toast.duration !== 0) {
      const d = toast.duration || 5000;
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), d);
    }
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <NotifyContext.Provider value={{ push, remove, toasts }}>
      {children}
    </NotifyContext.Provider>
  );
};

export const useNotify = () => useContext(NotifyContext);

export default NotifyContext;
