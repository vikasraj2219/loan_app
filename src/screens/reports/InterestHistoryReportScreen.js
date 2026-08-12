import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { reportApi } from '../../api/reportApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { formatCurrency } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function InterestHistoryReportScreen() {
  const [months, setMonths] = useState(6);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const { data } = await reportApi.getInterestCollectionHistory(months);
        setSeries(data.data.series);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load interest collection history.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [months]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const maxValue = Math.max(1, ...series.flatMap((s) => [s.generated, s.collected]));

  return (
    <View style={styles.flex}>
      <View style={styles.filterRow}>
        <SegmentedButtons
          value={String(months)}
          onValueChange={(v) => setMonths(Number(v))}
          buttons={[
            { value: '3', label: '3M' },
            { value: '6', label: '6M' },
            { value: '12', label: '12M' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4338CA" />
      ) : error && series.length === 0 ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#4338CA']} />}
        >
          <View style={styles.legendRow}>
            <LegendDot color="#4338CA" label="Generated" />
            <LegendDot color="#0D9488" label="Collected" />
          </View>

          {series.length === 0 ? (
            <EmptyState icon="chart-timeline-variant" title="No data yet" />
          ) : (
            series.map((s) => (
              <Card key={`${s.year}-${s.month}`} style={styles.monthCard} mode="outlined">
                <Card.Content>
                  <Text variant="titleSmall" style={styles.monthLabel}>
                    {s.label} {s.year}
                  </Text>
                  <BarRow label="Generated" value={s.generated} max={maxValue} color="#4338CA" />
                  <BarRow label="Collected" value={s.collected} max={maxValue} color="#0D9488" />
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="bodySmall" style={styles.legendLabel}>
        {label}
      </Text>
    </View>
  );
}

function BarRow({ label, value, max, color }) {
  const widthPct = Math.max(2, (value / max) * 100);
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelRow}>
        <Text variant="bodySmall" style={styles.barLabel}>
          {label}
        </Text>
        <Text variant="bodySmall" style={styles.barValue}>
          {formatCurrency(value)}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  filterRow: { padding: 16, paddingBottom: 8, backgroundColor: '#fff' },
  loader: { marginTop: 48 },
  content: { padding: 16, paddingBottom: 110 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: '#6B7280' },
  monthCard: { marginBottom: 12 },
  monthLabel: { fontWeight: '700', color: '#4338CA', marginBottom: 10 },
  barRow: { marginBottom: 10 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { color: '#6B7280' },
  barValue: { fontWeight: '600' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#E8EEF4', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
