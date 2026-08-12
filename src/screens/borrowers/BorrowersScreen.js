import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Searchbar, ActivityIndicator, FAB, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { borrowerApi } from '../../api/borrowerApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import BorrowerCard from '../../components/BorrowerCard';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, typography, spacing } from '../../theme/tokens';

const PAGE_LIMIT = 20;

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

export default function BorrowersScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState('active');
  const [borrowers, setBorrowers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBorrowers = useCallback(
    async ({ pageToLoad = 1, append = false, isRefresh = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const params = { page: pageToLoad, limit: PAGE_LIMIT };
        if (statusFilter !== 'all') params.status = statusFilter;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

        const { data } = await borrowerApi.list(params);
        const list = data.data.borrowers;
        setBorrowers((prev) => (append ? [...prev, ...list] : list));
        setHasNextPage(!!data.meta?.hasNextPage);
        setPage(pageToLoad);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load borrowers.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [statusFilter, debouncedSearch]
  );

  useFocusEffect(
    useCallback(() => {
      fetchBorrowers({ pageToLoad: 1 });
    }, [fetchBorrowers])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchBorrowers({ pageToLoad: page + 1, append: true });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Borrowers</Text>
        <Searchbar
          placeholder="Search by name, phone, email"
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          icon="magnify"
          elevation={0}
        />
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
      ) : error && borrowers.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchBorrowers({ pageToLoad: 1 })} />
      ) : (
        <FlatList
          data={borrowers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBorrowers({ pageToLoad: 1, isRefresh: true })} colors={[colors.indigo]} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListEmptyComponent={
            <EmptyState
              icon="account-search-outline"
              title="No borrowers found"
              description={debouncedSearch ? 'Try a different search term.' : 'Add your first borrower to get started.'}
            />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.indigo} /> : null}
          renderItem={({ item }) => (
            <BorrowerCard borrower={item} onPress={() => navigation.navigate('BorrowerDetails', { id: item._id, name: item.name })} />
          )}
        />
      )}

      <FAB icon="account-plus-outline" color="#FFFFFF" style={styles.fab} onPress={() => navigation.navigate('BorrowerForm')} label="Add" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.background },
  headerTitle: { ...typography.h1, color: colors.ink, marginBottom: spacing.md },
  searchbar: { marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md },
  searchInput: { fontSize: 15, minHeight: 40 },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.indigo },
  filterChipLabel: { ...typography.label, color: colors.inkMuted },
  filterChipLabelActive: { color: colors.white },
  loader: { marginTop: 48 },
  footerLoader: { marginVertical: 16 },
  listContent: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 96 },
  fab: { position: 'absolute', right: 16, bottom: 96, backgroundColor: colors.indigo },
});
