import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, Button, HelperText } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { reportApi } from '../../api/reportApi';
import DateRangeFilter from '../../components/DateRangeFilter';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { saveAndShareExport } from '../../utils/exportFile';

export default function CollectionsReportScreen() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const params = {};
        if (dateFrom.trim()) params.dateFrom = dateFrom.trim();
        if (dateTo.trim()) params.dateTo = dateTo.trim();
        const { data } = await reportApi.getCollections(params);
        setSummary(data.data.summary);
        setPayments(data.data.payments);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load the collection report.'));
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

  const handleExport = async (format) => {
    setExportingFormat(format);
    setError('');
    try {
      const params = {};
      if (dateFrom.trim()) params.dateFrom = dateFrom.trim();
      if (dateTo.trim()) params.dateTo = dateTo.trim();
      const response = await reportApi.exportCollectionsFile(format, params);
      await saveAndShareExport(response.data, { format, fileNamePrefix: 'collection-report' });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not export the report.'));
    } finally {
      setExportingFormat(null);
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
          <View style={styles.statsRow}>
            <SummaryCard label="Payments" value={String(summary.paymentCount)} />
            <SummaryCard label="Principal" value={formatCurrency(summary.totalPrincipal)} />
            <SummaryCard label="Interest" value={formatCurrency(summary.totalInterest)} />
            <SummaryCard label="Total" value={formatCurrency(summary.totalCollected)} color="#4338CA" />
          </View>

          <View style={styles.exportRow}>
            <Button
              mode="outlined"
              icon="file-delimited-outline"
              onPress={() => handleExport('csv')}
              loading={exportingFormat === 'csv'}
              disabled={!!exportingFormat}
              style={styles.exportButton}
              compact
            >
              CSV
            </Button>
            <Button
              mode="outlined"
              icon="file-excel-outline"
              onPress={() => handleExport('excel')}
              loading={exportingFormat === 'excel'}
              disabled={!!exportingFormat}
              style={styles.exportButton}
              compact
            >
              Excel
            </Button>
            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={() => handleExport('pdf')}
              loading={exportingFormat === 'pdf'}
              disabled={!!exportingFormat}
              style={styles.exportButton}
              compact
            >
              PDF
            </Button>
          </View>
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>

          <Card style={styles.listCard} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Payments
              </Text>
              {payments.length === 0 ? (
                <EmptyState icon="cash-remove" title="No payments in this range" />
              ) : (
                payments.map((p, idx) => (
                  <View key={p._id}>
                    {idx > 0 && <Divider />}
                    <View style={styles.paymentRow}>
                      <View style={styles.paymentRowText}>
                        <Text variant="bodyMedium" style={styles.rowTitle}>
                          {p.borrower?.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.rowSubtitle}>
                          {formatDate(p.paymentDate)} · {p.paymentMode}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.rowAmount}>
                        +{formatCurrency((p.principalPaid || 0) + (p.interestPaid || 0))}
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

function SummaryCard({ label, value, color = '#3A4453' }) {
  return (
    <Card style={styles.summaryCard} mode="elevated">
      <Card.Content style={styles.summaryCardContent}>
        <Text variant="titleMedium" style={[styles.summaryValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.summaryLabel}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { marginTop: 48 },
  content: { padding: 16, paddingBottom: 110 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summaryCard: { flexBasis: '48%' },
  summaryCardContent: { paddingVertical: 10 },
  summaryValue: { fontWeight: '700' },
  summaryLabel: { color: '#6B7280', marginTop: 2 },
  exportRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  exportButton: { flex: 1, borderColor: '#4338CA' },
  listCard: { marginTop: 12 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  paymentRowText: { flex: 1 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#6B7280', marginTop: 2 },
  rowAmount: { fontWeight: '700', color: '#0D9488' },
});
