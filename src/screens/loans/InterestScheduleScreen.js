import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { loanApi } from '../../api/loanApi';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function InterestScheduleScreen({ route }) {
  const { id } = route.params;
  const [months, setMonths] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const { data } = await loanApi.getInterestSchedule(id);
        setMonths(data.data.months);
        setSummary(data.data.summary);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load interest schedule.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (error && months.length === 0) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.indigo]} />}
    >
      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <SummaryItem label="Pending Months" value={String(summary.pendingMonths)} />
            <SummaryItem label="Pending Amount" value={formatCurrency(summary.pendingInterestAmount)} tone="amber" />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <SummaryItem label="Next Due" value={formatDate(summary.nextInterestDueDate)} small />
            <SummaryItem label="Last Paid" value={formatDate(summary.lastInterestPaidOn)} small />
          </View>
        </View>
      )}

      <Text style={styles.sectionHeading}>Month-by-Month Schedule</Text>

      {months.length === 0 ? (
        <View style={styles.emptyCard}>
          <EmptyState
            icon="calendar-blank-outline"
            title="No interest generated yet"
            description="Interest for the first month appears one month after the loan date."
          />
        </View>
      ) : (
        months.map((m) => (
          <View key={m._id} style={styles.monthCard}>
            <View style={styles.monthCardLeft}>
              <View style={[styles.monthIconWrap, { backgroundColor: STATUS_TINT[m.status] || colors.surfaceAlt }]}>
                <Text style={[styles.monthShort, { color: STATUS_FG[m.status] || colors.inkMuted }]}>{MONTH_NAMES[m.month]}</Text>
              </View>
            </View>
            <View style={styles.monthCardBody}>
              <View style={styles.monthCardTopRow}>
                <Text style={styles.monthTitle}>
                  {MONTH_NAMES[m.month]} {m.year}
                </Text>
                <StatusChip status={m.status} />
              </View>
              <Text style={styles.monthMeta}>
                {formatCurrency(m.principalOutstandingAtCharge)} principal · {m.interestRateAtCharge}% rate
              </Text>
              <View style={styles.monthBottomRow}>
                <Text style={styles.monthAmount}>{formatCurrency(m.interestAmount)}</Text>
                <Text style={styles.monthDue}>
                  Due {formatDate(m.dueDate)}
                  {m.paidDate ? ` · Paid ${formatDate(m.paidDate)}` : ''}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const STATUS_TINT = { paid: colors.tealSurface, pending: colors.amberSurface, overdue: colors.coralSurface };
const STATUS_FG = { paid: colors.teal, pending: colors.amber, overdue: colors.coral };

function SummaryItem({ label, value, tone, small }) {
  const toneColor = tone === 'amber' ? colors.amber : colors.ink;
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[small ? styles.summaryValueSmall : styles.summaryValue, { color: toneColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.sm },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1 },
  summaryLabel: { ...typography.caption, color: colors.inkFaint, marginBottom: 3 },
  summaryValue: { ...typography.h1, fontSize: 22 },
  summaryValueSmall: { ...typography.bodyLarge, fontWeight: '700', color: colors.ink },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  sectionHeading: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.sm },
  monthCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  monthCardLeft: { marginRight: spacing.md },
  monthIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  monthShort: { ...typography.label, fontWeight: '800' },
  monthCardBody: { flex: 1 },
  monthCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  monthMeta: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  monthBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  monthAmount: { ...typography.h3, color: colors.ink },
  monthDue: { ...typography.caption, color: colors.inkFaint },
});
