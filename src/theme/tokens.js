// Design tokens for the Loan Manager visual identity.
//
// Direction: a "lending operations" aesthetic — deep midnight indigo as the
// brand foundation, a royal-indigo accent for actions, and a restrained
// status palette (teal/amber/coral) used ONLY to communicate loan/interest
// health. Deliberately not a generic Material-blue template, and
// deliberately distinct from a personal-finance/budgeting look: no playful
// pastels, no expense-tracker greens-for-everything. Colour is reserved for
// meaning, not decoration.

export const colors = {
  // Brand foundation — deep midnight indigo, not generic navy.
  midnight: '#12153A',
  midnightDeep: '#0B0D26',
  indigo: '#4338CA', // primary action colour (royal indigo, not Material blue)
  indigoLight: '#6D5FEA',
  indigoSurface: '#EEECFC',

  // Status palette — used strictly for loan/interest/payment health.
  teal: '#0D9488', // healthy / paid / active
  tealSurface: '#E3F5F2',
  amber: '#B45309', // pending / needs attention
  amberSurface: '#FDF1DF',
  coral: '#DC2626', // overdue / critical
  coralSurface: '#FCE8E8',
  slate: '#64748B', // closed / neutral / inactive
  slateSurface: '#EEF1F5',

  // Neutrals
  ink: '#12142B',
  inkMuted: '#5B5F76',
  inkFaint: '#9AA0B4',
  border: '#E5E7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F8FC',
  background: '#F3F4FA',
  white: '#FFFFFF',
};

export const statusPalette = {
  active: { fg: colors.teal, bg: colors.tealSurface, icon: 'check-decagram' },
  paid: { fg: colors.teal, bg: colors.tealSurface, icon: 'check-circle' },
  pending: { fg: colors.amber, bg: colors.amberSurface, icon: 'clock-alert-outline' },
  partially_paid: { fg: colors.amber, bg: colors.amberSurface, icon: 'clock-alert-outline' },
  overdue: { fg: colors.coral, bg: colors.coralSurface, icon: 'alert-decagram' },
  closed: { fg: colors.slate, bg: colors.slateSurface, icon: 'archive-outline' },
  inactive: { fg: colors.slate, bg: colors.slateSurface, icon: 'account-off-outline' },
};

export const statusLabels = {
  active: 'Active',
  closed: 'Closed',
  overdue: 'Overdue',
  inactive: 'Inactive',
  pending: 'Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const typography = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '700' },
  bodyLarge: { fontSize: 16, fontWeight: '500' },
  body: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
};

// Cross-platform shadow presets (iOS shadow* props + Android elevation).
export const shadow = {
  sm: {
    shadowColor: colors.midnight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: colors.midnight,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: colors.midnight,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
};

export const gradients = {
  hero: [colors.midnight, '#232A63'],
  heroAlt: ['#1B1F52', '#4338CA'],
};
