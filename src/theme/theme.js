import { MD3LightTheme } from 'react-native-paper';
import { colors, statusPalette } from './tokens';

export const theme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.indigo,
    onPrimary: colors.white,
    primaryContainer: colors.indigoSurface,
    secondary: colors.teal,
    secondaryContainer: colors.tealSurface,
    error: colors.coral,
    errorContainer: colors.coralSurface,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceAlt,
    outline: colors.border,
    onSurface: colors.ink,
    onSurfaceVariant: colors.inkMuted,
  },
};

// Legacy alias — kept so screens not yet migrated to <StatusBadge> (which
// reads statusPalette directly) keep working during the incremental redesign.
export const statusColors = Object.fromEntries(Object.entries(statusPalette).map(([k, v]) => [k, v.fg]));
