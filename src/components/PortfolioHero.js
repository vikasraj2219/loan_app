import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, typography, spacing, gradients } from '../theme/tokens';

export default function PortfolioHero({ outstandingPrincipal, activeLoans, totalBorrowers, trend }) {
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Text style={styles.overline}>LOAN PORTFOLIO</Text>
      <Text style={styles.value}>{outstandingPrincipal}</Text>
      <Text style={styles.caption}>Outstanding Principal</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="cash-multiple" size={15} color="rgba(255,255,255,0.75)" />
          <Text style={styles.statText}>{activeLoans} Active Loans</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={15} color="rgba(255,255,255,0.75)" />
          <Text style={styles.statText}>{totalBorrowers} Borrowers</Text>
        </View>
      </View>

      {trend ? (
        <View style={styles.trendPill}>
          <MaterialCommunityIcons
            name={trend.direction === 'up' ? 'trending-up' : 'trending-down'}
            size={13}
            color={colors.white}
          />
          <Text style={styles.trendText}>{trend.label}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.xxl, ...shadow.lg },
  overline: { ...typography.overline, color: 'rgba(255,255,255,0.65)', marginBottom: spacing.sm },
  value: { ...typography.display, color: colors.white },
  caption: { ...typography.body, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: spacing.md },
  statText: { ...typography.caption, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trendText: { ...typography.caption, color: colors.white, fontWeight: '700' },
});
