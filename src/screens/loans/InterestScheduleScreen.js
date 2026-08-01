import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { loanApi } from '../../api/loanApi';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

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
        <ActivityIndicator size="large" color="#4338CA" />
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#4338CA']} />}
    >
      {summary && (
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Pending Months
                </Text>
                <Text variant="titleLarge" style={styles.summaryValue}>
                  {summary.pendingMonths}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Pending Amount
                </Text>
                <Text variant="titleLarge" style={[styles.summaryValue, { color: '#B45309' }]}>
                  {formatCurrency(summary.pendingInterestAmount)}
                </Text>
              </View>
            </View>
            <Divider style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Next Due
                </Text>
                <Text variant="bodyLarge">{formatDate(summary.nextInterestDueDate)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Last Paid
                </Text>
                <Text variant="bodyLarge">{formatDate(summary.lastInterestPaidOn)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.listCard} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Month-by-Month Schedule
          </Text>
          {months.length === 0 ? (
            <EmptyState
              icon="calendar-blank-outline"
              title="No interest generated yet"
              description="Interest for the first month appears one month after the loan date."
            />
          ) : (
            months.map((m, idx) => (
              <View key={m._id}>
                {idx > 0 && <Divider />}
                <View style={styles.monthRow}>
                  <View style={styles.monthRowText}>
                    <Text variant="bodyMedium" style={styles.rowTitle}>
                      {MONTH_NAMES[m.month]} {m.year}
                    </Text>
                    <Text variant="bodySmall" style={styles.rowSubtitle}>
                      Due {formatDate(m.dueDate)}
                      {m.paidDate ? ` · Paid ${formatDate(m.paidDate)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.monthRowRight}>
                    <Text variant="bodyMedium" style={styles.rowAmount}>
                      {formatCurrency(m.interestAmount)}
                    </Text>
                    <StatusChip status={m.status} />
                  </View>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1 },
  summaryLabel: { color: '#6B7280', marginBottom: 2 },
  summaryValue: { fontWeight: '700', color: '#4338CA' },
  summaryDivider: { marginVertical: 12 },
  listCard: {},
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  monthRowText: { flex: 1 },
  monthRowRight: { alignItems: 'flex-end', gap: 4 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#6B7280', marginTop: 2 },
  rowAmount: { fontWeight: '700', color: '#4338CA' },
});
