import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { reportApi } from '../../api/reportApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function OverdueInterestReportScreen() {
  const [summary, setSummary] = useState(null);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await reportApi.getOverdueInterest();
      setSummary(data.data.summary);
      setMonths(data.data.months);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the overdue interest report.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  if (error && !summary) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#4338CA']} />}
    >
      <Card style={styles.summaryCard} mode="elevated">
        <Card.Content>
          <View style={styles.summaryRow}>
            <SummaryItem label="Loans Affected" value={String(summary.loansAffected)} />
            <SummaryItem label="Overdue Months" value={String(summary.totalOverdueMonths)} />
          </View>
          <Divider style={styles.summaryDivider} />
          <SummaryItem label="Total Overdue Interest" value={formatCurrency(summary.totalOverdueInterest)} color="#DC2626" full />
        </Card.Content>
      </Card>

      <Card style={styles.listCard} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Overdue Months
          </Text>
          {months.length === 0 ? (
            <EmptyState icon="check-circle-outline" title="Nothing overdue" description="All interest is on schedule." />
          ) : (
            months.map((m, idx) => (
              <View key={m._id}>
                {idx > 0 && <Divider />}
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text variant="bodyMedium" style={styles.rowTitle}>
                      {m.borrower?.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.rowSubtitle}>
                      {m.daysOverdue} day{m.daysOverdue === 1 ? '' : 's'} overdue · Due {formatDate(m.dueDate)}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.rowAmount}>
                    {formatCurrency(m.pendingAmount)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function SummaryItem({ label, value, color = '#4338CA', full }) {
  return (
    <View style={full ? styles.summaryItemFull : styles.summaryItem}>
      <Text variant="bodySmall" style={styles.summaryLabel}>
        {label}
      </Text>
      <Text variant={full ? 'headlineSmall' : 'titleLarge'} style={[styles.summaryValue, { color }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 110 },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1 },
  summaryItemFull: { alignItems: 'center' },
  summaryLabel: { color: '#6B7280', marginBottom: 2 },
  summaryValue: { fontWeight: '700' },
  summaryDivider: { marginVertical: 12 },
  listCard: {},
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowText: { flex: 1 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#6B7280', marginTop: 2 },
  rowAmount: { fontWeight: '700', color: '#DC2626' },
});
