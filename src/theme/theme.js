import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1E3A5F',
    secondary: '#2E7D5B',
    error: '#B3261E',
    background: '#F5F7FA',
  },
};

export const statusColors = {
  active: '#2E7D5B',
  closed: '#6B7280',
  overdue: '#B3261E',
  pending: '#B08900',
  partially_paid: '#B08900',
  paid: '#2E7D5B',
  inactive: '#6B7280',
};
