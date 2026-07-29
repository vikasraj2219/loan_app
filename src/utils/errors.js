export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.message === 'Network Error') {
    return 'Cannot reach the server. If it just woke up from sleep, try again in a moment.';
  }
  return err?.response?.data?.message || fallback;
};
