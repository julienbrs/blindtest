'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export interface Toast {
  id: string
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const DEFAULT_DURATION = 5000

function ToastIcon({ type }: { type: Toast['type'] }) {
  const iconClass = 'h-5 w-5 flex-shrink-0'

  switch (type) {
    case 'success':
      return <CheckCircleIcon className={iconClass} />
    case 'warning':
      return <ExclamationTriangleIcon className={iconClass} />
    case 'error':
      return <ExclamationCircleIcon className={iconClass} />
    case 'info':
    default:
      return <InformationCircleIcon className={iconClass} />
  }
}

function getToastStyles(type: Toast['type']): string {
  switch (type) {
    case 'success':
      return 'bg-green-600/95 text-white'
    case 'warning':
      return 'bg-yellow-600/95 text-white'
    case 'error':
      return 'bg-red-600/95 text-white'
    case 'info':
    default:
      return 'bg-blue-600/95 text-white'
  }
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 space-y-2 z-50 pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-xl backdrop-blur-sm ${getToastStyles(toast.type)}`}
            role="alert"
          >
            <ToastIcon type={toast.type} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Fermer la notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss if duration is not 0
    if (toast.duration !== 0) {
      const duration = toast.duration ?? DEFAULT_DURATION
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
