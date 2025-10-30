import toast from 'react-hot-toast';

/**
 * Show a success toast notification
 * @param message The message to display
 * @param duration Duration in milliseconds (default: 3000)
 */
export const showSuccessToast = (message: string, duration = 3000) => {
  return toast.success(message, {
    duration,
    position: 'top-right',
    style: {
      background: '#4caf50',
      color: '#fff',
    },
  });
};

/**
 * Show an error toast notification
 * @param message The message to display
 * @param duration Duration in milliseconds (default: 4000)
 */
export const showErrorToast = (message: string, duration = 4000) => {
  return toast.error(message, {
    duration,
    position: 'top-right',
    // style: {
    //   background: '#f44336',
    //   color: '#fff',
    // },
  });
};

/**
 * Show a loading toast notification
 * @param message The message to display
 * @returns A function to dismiss the toast
 */
export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

/**
 * Dismiss a specific toast notification
 * @param toastId The ID of the toast to dismiss
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Show a promise toast notification
 * @param promise The promise to track
 * @param messages Object containing loading, success, and error messages
 */
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: 'top-right',
    }
  );
};