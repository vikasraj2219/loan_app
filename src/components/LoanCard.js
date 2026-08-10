import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusChip from './StatusChip';
import { colors, radius, shadow, typography, spacing } from '../theme/tokens';
import { formatCurrency } from '../utils/format';

export default function LoanCard({ loan, onPress }) {
  const hasPendingInterest = loan.pendingInterest > 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.borrowerName} numberOfLines={1}>
          {loan.borrower?.name}
        </Text>
        <StatusChip status={loan.status} />
      </View>

      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Original Loan</Text>
          <Text style={styles.amountValue}>{formatCurrency(loan.loanAmount)}</Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Outstanding</Text>
          <Text style={[styles.amountValue, styles.outstandingValue]}>{formatCurrency(loan.principalOutstanding)}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.ratePill}>
          <MaterialCommunityIcons name="percent-outline" size={12} color={colors.inkMuted} />
          <Text style={styles.rateText}>{loan.interestRate}% Monthly</Text>
        </View>
        {hasPendingInterest ? (
          <View style={styles.pendingPill}>
            <MaterialCommunityIcons name="clock-alert-outline" size={12} color={colors.amber} />
            <Text style={styles.pendingText}>{formatCurrency(loan.pendingInterest)} pending</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  borrowerName: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700', flexShrink: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  amountBlock: { flex: 1 },
  amountDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: spacing.md },
  amountLabel: { ...typography.caption, color: colors.inkFaint, marginBottom: 3 },
  amountValue: { ...typography.h3, color: colors.ink },
  outstandingValue: { color: colors.indigo },
  bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rateText: { ...typography.caption, color: colors.inkMuted, fontWeight: '600', fontSize: 11 },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amberSurface,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendingText: { ...typography.caption, color: colors.amber, fontWeight: '700', fontSize: 11 },
});
