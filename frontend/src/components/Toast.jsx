import React from 'react';
import { useToastStore } from '../store/toastStore';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

const iconMap = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type} ${toast.leaving ? 'toast-leave' : 'toast-enter'}`}
        >
          <div className="toast-icon">{iconMap[toast.type]}</div>
          <p className="toast-message">{toast.message}</p>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
          <div className="toast-progress">
            <div className={`toast-progress-bar toast-progress-${toast.type}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
