import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, typography, spacing } from '../theme/tokens';
import { formatCurrency } from '../utils/format';

export default function RepaymentProgress({ loanAmount, outstanding }) {
  const repaid = Math.max(loanAmount - outstanding, 0);
  const pct = loanAmount > 0 ? Math.min(Math.round((repaid / loanAmount) * 100), 100) : 0;

  return (
    <View>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Original Loan</Text>
          <Text style={styles.bigValue}>{formatCurrency(loanAmount)}</Text>
        </View>
        <View style={styles.alignRight}>
          <Text style={styles.label}>Outstanding Principal</Text>
          <Text style={[styles.bigValue, styles.outstandingValue]}>{formatCurrency(outstanding)}</Text>
        </View>
      </View>

      <View style={styles.progressHeaderRow}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPct}>{pct}% Repaid</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.repaidCaption}>{formatCurrency(repaid)} repaid so far</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  alignRight: { alignItems: 'flex-end' },
  label: { ...typography.caption, color: colors.inkFaint, marginBottom: 3 },
  bigValue: { ...typography.h1, color: colors.ink },
  outstandingValue: { color: colors.indigo },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { ...typography.caption, color: colors.inkMuted },
  progressPct: { ...typography.caption, color: colors.teal, fontWeight: '800' },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.teal },
  repaidCaption: { ...typography.caption, color: colors.inkMuted, marginTop: 8 },
});
