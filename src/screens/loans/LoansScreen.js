import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { ActivityIndicator, FAB, Text, Menu, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { loanApi } from '../../api/loanApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoanCard from '../../components/LoanCard';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, typography, spacing } from '../../theme/tokens';

const PAGE_LIMIT = 20;

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

const SORTS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-principalOutstanding', label: 'Highest Outstanding' },
  { value: 'principalOutstanding', label: 'Lowest Outstanding' },
  { value: '-interestRate', label: 'Highest Interest' },
  { value: 'dueDate', label: 'Most Overdue' },
];

export default function LoansScreen({ navigation }) {
  const [statusFilter, setStatusFilter] = useState('active');
  const [sort, setSort] = useState('-createdAt');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [loans, setLoans] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLoans = useCallback(
    async ({ pageToLoad = 1, append = false, isRefresh = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const params = { page: pageToLoad, limit: PAGE_LIMIT, sort };
        if (statusFilter !== 'all') params.status = statusFilter;

        const { data } = await loanApi.list(params);
        const list = data.data.loans;
        setLoans((prev) => (append ? [...prev, ...list] : list));
        setHasNextPage(!!data.meta?.hasNextPage);
        setPage(pageToLoad);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load loans.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [statusFilter, sort]
  );

  useFocusEffect(
    useCallback(() => {
      fetchLoans({ pageToLoad: 1 });
    }, [fetchLoans])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchLoans({ pageToLoad: page + 1, append: true });
    }
  };

  const activeSortLabel = SORTS.find((s) => s.value === sort)?.label;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Loans</Text>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Pressable style={styles.sortButton} onPress={() => setSortMenuVisible(true)}>
                <IconButton icon="sort" size={16} style={styles.sortIcon} iconColor={colors.indigo} />
                <Text style={styles.sortLabel} numberOfLines={1}>
                  {activeSortLabel}
                </Text>
              </Pressable>
            }
          >
            {SORTS.map((s) => (
              <Menu.Item
                key={s.value}
                title={s.label}
                onPress={() => {
                  setSort(s.value);
                  setSortMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setStatusFilter(f.value)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.indigo} />
      ) : error && loans.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchLoans({ pageToLoad: 1 })} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLoans({ pageToLoad: 1, isRefresh: true })} colors={[colors.indigo]} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListEmptyComponent={<EmptyState icon="cash-multiple" title="No loans found" description="Add a loan to get started." />}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.indigo} /> : null}
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onPress={() => navigation.navigate('LoanDetails', { id: item._id, borrowerName: item.borrower?.name })}
            />
          )}
        />
      )}

      <FAB icon="cash-plus" color="#FFFFFF" style={styles.fab} onPress={() => navigation.navigate('LoanForm')} label="New Loan" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.background },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { ...typography.h1, color: colors.ink },
  sortButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingRight: 12 },
  sortIcon: { margin: 0 },
  sortLabel: { ...typography.caption, color: colors.indigo, fontWeight: '700', maxWidth: 120 },
  filterRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.indigo },
  filterChipLabel: { ...typography.label, color: colors.inkMuted },
  filterChipLabelActive: { color: colors.white },
  loader: { marginTop: 48 },
  footerLoader: { marginVertical: 16 },
  listContent: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 96 },
  fab: { position: 'absolute', right: 16, bottom: 96, backgroundColor: colors.indigo },
});
