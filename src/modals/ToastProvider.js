// src/modals/ToastProvider.js
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from './ToastModel';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    show: false,
    title: '',
    message: '',
    isError: false,
    isDelete: false,
    icon: null,
  });

  const timeoutRef = useRef(null);

  const showToast = useCallback(({ title, message, isError = false, isDelete = false, icon = null }) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ show: true, title, message, isError, isDelete, icon });

    timeoutRef.current = setTimeout(() => {
      setToast(t => ({ ...t, show: false }));
      timeoutRef.current = null;
    }, 3000);
  }, []);

  const onClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(t => ({ ...t, show: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        showToast={toast.show}
        title={toast.title}
        message={toast.message}
        isError={toast.isError}
        isDelete={toast.isDelete}
        icon={toast.icon}
        onClose={onClose}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
