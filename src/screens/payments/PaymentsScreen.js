import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { ActivityIndicator, Divider, FAB, SegmentedButtons, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { paymentApi } from '../../api/paymentApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import MobileRecordCard from '../../components/MobileRecordCard';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const PAGE_LIMIT = 20;

const MODE_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  other: 'Other',
};

export default function PaymentsScreen({ navigation }) {
  const [modeFilter, setModeFilter] = useState('all');
  const [payments, setPayments] = useState([]);
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
        const params = { page: pageToLoad, limit: PAGE_LIMIT };
        if (modeFilter !== 'all') params.paymentMode = modeFilter;

        const { data } = await paymentApi.list(params);
        const list = data.data.payments;
        setPayments((prev) => (append ? [...prev, ...list] : list));
        setHasNextPage(!!data.meta?.hasNextPage);
        setPage(pageToLoad);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load payments.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [modeFilter]
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
      <View style={styles.filters}>
        <SegmentedButtons
          value={modeFilter}
          onValueChange={setModeFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'cash', label: 'Cash' },
            { value: 'upi', label: 'UPI' },
            { value: 'bank_transfer', label: 'Bank' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4338CA" />
      ) : error && payments.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchPayments({ pageToLoad: 1 })} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayments({ pageToLoad: 1, isRefresh: true })} colors={['#4338CA']} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <EmptyState icon="cash-remove" title="No payments recorded" description="Tap Record to add the first one." />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#4338CA" /> : null}
          renderItem={({ item }) => (
            <MobileRecordCard
              title={item.borrower?.name}
              subtitle={`${formatDate(item.paymentDate)} · ${MODE_LABELS[item.paymentMode] || item.paymentMode}`}
              right={
                <Text variant="bodyMedium" style={styles.amountText}>
                  +{formatCurrency((item.principalPaid || 0) + (item.interestPaid || 0))}
                </Text>
              }
              onPress={() => navigation.navigate('PaymentDetails', { id: item._id, borrowerName: item.borrower?.name })}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        label="Record"
        onPress={() => navigation.navigate('SelectBorrowerForPayment')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  filters: { padding: 16, paddingBottom: 8, backgroundColor: '#fff' },
  loader: { marginTop: 48 },
  footerLoader: { marginVertical: 16 },
  listContent: { flexGrow: 1, paddingBottom: 96 },
  amountText: { fontWeight: '700', color: '#0D9488', marginRight: 4 },
  fab: { position: 'absolute', right: 16, bottom: 96, backgroundColor: '#4338CA' },
});
