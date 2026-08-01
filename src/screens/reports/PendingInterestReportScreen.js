import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { reportApi } from '../../api/reportApi';
import DateRangeFilter from '../../components/DateRangeFilter';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { saveAndShareExport } from '../../utils/exportFile';

export default function PendingInterestReportScreen() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [borrowerSummaries, setBorrowerSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const params = {};
        if (dateFrom.trim()) params.dateFrom = dateFrom.trim();
        if (dateTo.trim()) params.dateTo = dateTo.trim();
        const { data } = await reportApi.getPendingInterest(params);
        setSummary(data.data.summary);
        setBorrowerSummaries(data.data.borrowerSummaries);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load the pending interest report.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateFrom, dateTo]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const params = {};
      if (dateFrom.trim()) params.dateFrom = dateFrom.trim();
      if (dateTo.trim()) params.dateTo = dateTo.trim();
      const response = await reportApi.exportPendingInterestCsv(params);
      await saveAndShareExport(response.data, { format: 'csv', fileNamePrefix: 'pending-interest' });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not export the report.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onChangeFrom={setDateFrom} onChangeTo={setDateTo} onApply={() => load()} />

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4338CA" />
      ) : error && !summary ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#4338CA']} />}
        >
          <Card style={styles.summaryCard} mode="elevated">
            <Card.Content>
              <View style={styles.summaryRow}>
                <SummaryItem label="Borrowers Affected" value={String(summary.borrowersAffected)} />
                <SummaryItem label="Pending Months" value={String(summary.totalPendingMonths)} />
              </View>
              <Divider style={styles.summaryDivider} />
              <SummaryItem label="Total Pending Interest" value={formatCurrency(summary.totalPendingInterest)} color="#B45309" full />
            </Card.Content>
          </Card>

          <Button
            mode="outlined"
            icon="file-delimited-outline"
            onPress={handleExport}
            loading={exporting}
            disabled={exporting}
            style={styles.exportButton}
          >
            Export CSV
          </Button>

          <Card style={styles.listCard} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                By Borrower
              </Text>
              {borrowerSummaries.length === 0 ? (
                <EmptyState icon="check-circle-outline" title="No pending interest" description="Everything is settled." />
              ) : (
                borrowerSummaries.map((b, idx) => (
                  <View key={b.borrower?._id || idx}>
                    {idx > 0 && <Divider />}
                    <View style={styles.row}>
                      <View style={styles.rowText}>
                        <Text variant="bodyMedium" style={styles.rowTitle}>
                          {b.borrower?.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.rowSubtitle}>
                          {b.pendingMonths} month{b.pendingMonths === 1 ? '' : 's'} · Oldest due {formatDate(b.oldestDueDate)}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.rowAmount}>
                        {formatCurrency(b.pendingInterestAmount)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      )}
    </View>
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
  loader: { marginTop: 48 },
  content: { padding: 16, paddingBottom: 32 },
  summaryCard: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1 },
  summaryItemFull: { alignItems: 'center' },
  summaryLabel: { color: '#6B7280', marginBottom: 2 },
  summaryValue: { fontWeight: '700' },
  summaryDivider: { marginVertical: 12 },
  exportButton: { marginBottom: 12, borderColor: '#4338CA' },
  listCard: {},
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowText: { flex: 1 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#6B7280', marginTop: 2 },
  rowAmount: { fontWeight: '700', color: '#B45309' },
});
