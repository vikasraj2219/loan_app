import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, SegmentedButtons, ActivityIndicator, Divider, FAB, Text, Badge } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { borrowerApi } from '../../api/borrowerApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import MobileRecordCard from '../../components/MobileRecordCard';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../utils/errors';

const PAGE_LIMIT = 20;

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
      <View style={styles.filters}>
        <Searchbar
          placeholder="Search by name, phone, email"
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          style={styles.segmented}
          buttons={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#1E3A5F" />
      ) : error && borrowers.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchBorrowers({ pageToLoad: 1 })} />
      ) : (
        <FlatList
          data={borrowers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBorrowers({ pageToLoad: 1, isRefresh: true })} colors={['#1E3A5F']} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <EmptyState
              icon="account-search-outline"
              title="No borrowers found"
              description={debouncedSearch ? 'Try a different search term.' : 'Add your first borrower to get started.'}
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#1E3A5F" /> : null
          }
          renderItem={({ item }) => (
            <MobileRecordCard
              title={item.name}
              subtitle={item.phone}
              onPress={() => navigation.navigate('BorrowerDetails', { id: item._id, name: item.name })}
              right={
                item.pendingMonths > 0 ? (
                  <View style={styles.pendingWrap}>
                    <Badge style={styles.badge}>{item.pendingMonths}</Badge>
                    <Text variant="labelSmall" style={styles.pendingLabel}>
                      pending
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('BorrowerForm')} label="Add" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  filters: { padding: 16, paddingBottom: 8, backgroundColor: '#fff' },
  searchbar: { marginBottom: 12, elevation: 0, backgroundColor: '#F0F2F5' },
  searchInput: { fontSize: 15, minHeight: 40 },
  segmented: {},
  loader: { marginTop: 48 },
  footerLoader: { marginVertical: 16 },
  listContent: { flexGrow: 1, paddingBottom: 96 },
  pendingWrap: { alignItems: 'center' },
  badge: { backgroundColor: '#B08900' },
  pendingLabel: { color: '#B08900', marginTop: 2 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1E3A5F' },
});
