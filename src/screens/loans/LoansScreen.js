import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SegmentedButtons, ActivityIndicator, Divider, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { loanApi } from '../../api/loanApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import MobileRecordCard from '../../components/MobileRecordCard';
import StatusChip from '../../components/StatusChip';
import { formatCurrency } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const PAGE_LIMIT = 20;

export default function LoansScreen({ navigation }) {
  const [statusFilter, setStatusFilter] = useState('active');
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
        const params = { page: pageToLoad, limit: PAGE_LIMIT, sort: '-createdAt' };
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
    [statusFilter]
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

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { value: 'active', label: 'Active' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'closed', label: 'Closed' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4338CA" />
      ) : error && loans.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchLoans({ pageToLoad: 1 })} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLoans({ pageToLoad: 1, isRefresh: true })} colors={['#4338CA']} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <EmptyState icon="cash-multiple" title="No loans found" description="Add a loan to get started." />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#4338CA" /> : null}
          renderItem={({ item }) => (
            <MobileRecordCard
              title={item.borrower?.name}
              subtitle={`${formatCurrency(item.loanAmount)} · ${item.interestRate}% monthly`}
              statusChip={<StatusChip status={item.status} />}
              onPress={() =>
                navigation.navigate('LoanDetails', {
                  id: item._id,
                  borrowerName: item.borrower?.name,
                })
              }
            />
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('LoanForm')} label="New Loan" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  filters: { padding: 16, paddingBottom: 8, backgroundColor: '#fff' },
  loader: { marginTop: 48 },
  footerLoader: { marginVertical: 16 },
  listContent: { flexGrow: 1, paddingBottom: 96 },
  fab: { position: 'absolute', right: 16, bottom: 96, backgroundColor: '#4338CA' },
});
