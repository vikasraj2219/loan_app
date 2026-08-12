import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { ActivityIndicator, FAB, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { paymentApi } from '../../api/paymentApi';
import { reportApi } from '../../api/reportApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PaymentCard from '../../components/PaymentCard';
import { formatCurrency } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

const PAGE_LIMIT = 20;

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

function getRangeDates(range) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'today') return { dateFrom: startOfToday.toISOString().slice(0, 10) };
  if (range === 'week') {
    const day = startOfToday.getDay();
    const monday = new Date(startOfToday);
    monday.setDate(startOfToday.getDate() - ((day + 6) % 7));
    return { dateFrom: monday.toISOString().slice(0, 10) };
  }
  if (range === 'month') {
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: firstOfMonth.toISOString().slice(0, 10) };
  }
  return {};
}

export default function PaymentsScreen({ navigation }) {
  const [range, setRange] = useState('month');
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPayments = useCallback(
    async ({ pageToLoad = 1, append = false, isRefresh = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const dateParams = getRangeDates(range);
        const [listRes, summaryRes] = await Promise.all([
          paymentApi.list({ page: pageToLoad, limit: PAGE_LIMIT, ...dateParams }),
          append ? Promise.resolve(null) : reportApi.getCollections(dateParams),
        ]);
        const list = listRes.data.data.payments;
        setPayments((prev) => (append ? [...prev, ...list] : list));
        setHasNextPage(!!listRes.data.meta?.hasNextPage);
        setPage(pageToLoad);
        if (summaryRes) setSummary(summaryRes.data.data.summary);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load payments.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useFocusEffect(
    useCallback(() => {
      fetchPayments({ pageToLoad: 1 });
    }, [fetchPayments])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchPayments({ pageToLoad: page + 1, append: true });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>

        {summary && (
          <View style={styles.statsCard}>
            <View style={styles.statsTop}>
              <Text style={styles.statsLabel}>Total Collected</Text>
              <Text style={styles.statsValue}>{formatCurrency(summary.totalCollected)}</Text>
            </View>
            <View style={styles.statsSplitRow}>
              <View style={styles.statsSplitItem}>
                <Text style={styles.statsSplitLabel}>Principal</Text>
                <Text style={styles.statsSplitValue}>{formatCurrency(summary.totalPrincipal)}</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsSplitItem}>
                <Text style={styles.statsSplitLabel}>Interest</Text>
                <Text style={styles.statsSplitValue}>{formatCurrency(summary.totalInterest)}</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsSplitItem}>
                <Text style={styles.statsSplitLabel}>Payments</Text>
                <Text style={styles.statsSplitValue}>{summary.paymentCount}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.filterRow}>
          {RANGES.map((r) => {
            const active = range === r.value;
            return (
              <Pressable key={r.value} onPress={() => setRange(r.value)} style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.indigo} />
      ) : error && payments.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchPayments({ pageToLoad: 1 })} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayments({ pageToLoad: 1, isRefresh: true })} colors={[colors.indigo]} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListEmptyComponent={<EmptyState icon="cash-remove" title="No payments recorded" description="Tap Record to add the first one." />}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.indigo} /> : null}
          renderItem={({ item }) => (
            <PaymentCard payment={item} onPress={() => navigation.navigate('PaymentDetails', { id: item._id, borrowerName: item.borrower?.name })} />
          )}
        />
      )}

      <FAB icon="receipt" color="#FFFFFF" style={styles.fab} label="Record" onPress={() => navigation.navigate('SelectBorrowerForPayment')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.background },
  headerTitle: { ...typography.h1, color: colors.ink, marginBottom: spacing.md },
  statsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  statsTop: { marginBottom: spacing.md },
  statsLabel: { ...typography.caption, color: colors.inkFaint },
  statsValue: { ...typography.display, fontSize: 28, color: colors.ink, marginTop: 2 },
  statsSplitRow: { flexDirection: 'row', alignItems: 'center' },
  statsSplitItem: { flex: 1 },
  statsSplitLabel: { ...typography.caption, color: colors.inkMuted },
  statsSplitValue: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700', marginTop: 2 },
  statsDivider: { width: 1, height: 28, backgroundColor: colors.border, marginHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.indigo },
  filterChipLabel: { ...typography.label, color: colors.inkMuted },
  filterChipLabelActive: { color: colors.white },
  loader: { marginTop: 48 },
  footerLoader: { marginVertical: 16 },
  listContent: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 96 },
  fab: { position: 'absolute', right: 16, bottom: 96, backgroundColor: colors.indigo },
});
