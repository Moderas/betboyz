import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let _nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_nextId;
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          zIndex: 9999,
          maxWidth: '340px',
        }}
      >
        {items.map((item) => (
          <ToastMessage key={item.id} item={item} onDismiss={() =>
            setItems((prev) => prev.filter((t) => t.id !== item.id))
          } />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const bg =
    item.type === 'success'
      ? 'rgba(61,220,132,0.15)'
      : item.type === 'error'
        ? 'rgba(255,87,87,0.15)'
        : 'rgba(245,200,66,0.15)';
  const border =
    item.type === 'success'
      ? 'rgba(61,220,132,0.4)'
      : item.type === 'error'
        ? 'rgba(255,87,87,0.4)'
        : 'rgba(245,200,66,0.4)';
  const color =
    item.type === 'success' ? '#3ddc84' : item.type === 'error' ? '#ff5757' : '#f5c842';

  return (
    <div
      onClick={onDismiss}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        color,
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {item.message}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
