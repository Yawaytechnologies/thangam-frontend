import axios from 'axios';

/** Extracts a human-readable message from any axios or unknown error */
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Network error — please check your connection.';
    const msg = error.response.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || `Server error (${error.response.status})`;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
