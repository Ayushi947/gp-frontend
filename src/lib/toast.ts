import { toast as sonnerToast } from 'sonner';

/**
 * Track the current toast ID to ensure only one toast is visible at a time
 */
let currentToastId: string | number | undefined;

/**
 * Dismiss the current toast if one exists
 */
function dismissCurrentToast() {
  if (currentToastId !== undefined) {
    sonnerToast.dismiss(currentToastId);
    currentToastId = undefined;
  }
}

/**
 * Toast utility wrapper that ensures only one toast is visible at a time
 * Position: Bottom center
 * Behavior: New toast dismisses any existing toast
 */
export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, description?: string) => {
    dismissCurrentToast();
    currentToastId = sonnerToast.success(message, {
      description,
      duration: 4000,
    });
    return currentToastId;
  },

  /**
   * Show an error toast
   */
  error: (message: string, description?: string) => {
    dismissCurrentToast();
    currentToastId = sonnerToast.error(message, {
      description,
      duration: 5000,
    });
    return currentToastId;
  },

  /**
   * Show an info toast
   */
  info: (message: string, description?: string) => {
    dismissCurrentToast();
    currentToastId = sonnerToast.info(message, {
      description,
      duration: 4000,
    });
    return currentToastId;
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, description?: string) => {
    dismissCurrentToast();
    currentToastId = sonnerToast.warning(message, {
      description,
      duration: 4500,
    });
    return currentToastId;
  },

  /**
   * Show a loading toast
   */
  loading: (message: string) => {
    dismissCurrentToast();
    currentToastId = sonnerToast.loading(message, {
      duration: Infinity,
    });
    return currentToastId;
  },

  /**
   * Dismiss the current toast
   */
  dismiss: () => {
    dismissCurrentToast();
  },

  /**
   * Show a promise toast that updates based on promise state
   * Automatically handles loading, success, and error states
   */
  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    dismissCurrentToast();

    // Show loading toast
    currentToastId = sonnerToast.loading(messages.loading, {
      duration: Infinity,
    });

    try {
      const result = await promise;

      // Dismiss loading and show success
      if (currentToastId !== undefined) {
        sonnerToast.dismiss(currentToastId);
      }

      const successMessage =
        typeof messages.success === 'function'
          ? messages.success(result)
          : messages.success;

      currentToastId = sonnerToast.success(successMessage, {
        duration: 4000,
      });

      return result;
    } catch (error) {
      // Dismiss loading and show error
      if (currentToastId !== undefined) {
        sonnerToast.dismiss(currentToastId);
      }

      const errorMessage =
        typeof messages.error === 'function'
          ? messages.error(error as Error)
          : messages.error;

      currentToastId = sonnerToast.error(errorMessage, {
        duration: 5000,
      });

      throw error;
    }
  },

  /**
   * Show a custom toast with action button
   */
  action: (
    message: string,
    options: {
      description?: string;
      action: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    dismissCurrentToast();
    currentToastId = sonnerToast(message, {
      description: options.description,
      duration: 6000,
      action: {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
    return currentToastId;
  },

  /**
   * Update an existing toast
   */
  update: (
    id: string | number,
    options: {
      message?: string;
      description?: string;
      type?: 'success' | 'error' | 'info' | 'warning';
    }
  ) => {
    // Sonner doesn't support direct updates, so we dismiss and create new
    sonnerToast.dismiss(id);

    const { message = 'Updated', description, type = 'info' } = options;

    switch (type) {
      case 'success':
        currentToastId = sonnerToast.success(message, { description });
        break;
      case 'error':
        currentToastId = sonnerToast.error(message, { description });
        break;
      case 'warning':
        currentToastId = sonnerToast.warning(message, { description });
        break;
      default:
        currentToastId = sonnerToast.info(message, { description });
    }

    return currentToastId;
  },
};

/**
 * Common toast messages for consistent UX
 */
export const toastMessages = {
  // Generic operations
  saved: 'Changes saved successfully',
  deleted: 'Item deleted successfully',
  created: 'Item created successfully',
  updated: 'Item updated successfully',
  copied: 'Copied to clipboard',

  // Errors
  genericError: 'Something went wrong. Please try again.',
  networkError: 'Unable to connect. Please check your internet connection.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  unauthorized: 'You do not have permission to perform this action.',
  notFound: 'The requested item could not be found.',

  // Validation
  validationError: 'Please check the form for errors.',
  requiredFields: 'Please fill in all required fields.',

  // File operations
  uploadSuccess: 'File uploaded successfully',
  uploadError: 'Failed to upload file. Please try again.',
  downloadStarted: 'Download started',
  exportSuccess: 'Export completed successfully',

  // Auth
  loginSuccess: 'Welcome back!',
  loginError: 'Invalid email or password. Please try again.',
  logoutSuccess: 'You have been signed out.',
  passwordChanged: 'Password changed successfully',

  // Participant operations
  participantAdded: 'Participant added successfully',
  participantUpdated: 'Participant information updated',
  participantRemoved: 'Participant removed from plan',
  inviteSent: 'Invitation sent successfully',

  // Contribution operations
  contributionProcessed: 'Contribution processed successfully',
  payrollUploaded: 'Payroll file uploaded successfully',

  // Plan operations
  planUpdated: 'Plan settings updated',
  documentSigned: 'Document signed successfully',
} as const;
