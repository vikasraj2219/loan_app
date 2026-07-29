import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import StatCard from '../../components/StatCard';
import StatusChip from '../../components/StatusChip';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [statusDist, setStatusDist] = useState(null);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [summaryRes, distRes, overdueRes, paymentsRes, topRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getLoanStatusDistribution(),
        dashboardApi.getOverdueLoans(5),
        dashboardApi.getRecentPayments(5),
        dashboardApi.getTopBorrowers(5),
      ]);
      setSummary(summaryRes.data.data);
      setStatusDist(distRes.data.data);
      setOverdueLoans(overdueRes.data.data.loans);
      setRecentPayments(paymentsRes.data.data.payments);
      setTopBorrowers(topRes.data.data.borrowers);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load dashboard data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (error && !summary) {
    return <ErrorState message={error} onRetry={() => loadData()} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={['#1E3A5F']} />}
    >
      <Text variant="headlineSmall" style={styles.greeting}>
        Welcome, {user?.name?.split(' ')[0] || 'there'}
      </Text>

      <View style={styles.statsGrid}>
        <StatCard label="Active Loans" value={summary.activeLoans} icon="cash-multiple" color="#1E3A5F" />
        <StatCard label="Total Borrowers" value={summary.totalBorrowers} icon="account-group" color="#2E7D5B" />
        <StatCard label="Outstanding Principal" value={formatCurrency(summary.outstandingPrincipal)} icon="chart-line" color="#1E3A5F" />
        <StatCard label="Overdue Loans" value={summary.overdueLoans} icon="alert-circle-outline" color="#B3261E" />
        <StatCard label="Today's Collection" value={formatCurrency(summary.todaysCollection)} icon="cash-plus" color="#2E7D5B" />
        <StatCard label="This Month" value={formatCurrency(summary.monthlyCollection)} icon="calendar-month-outline" color="#2E7D5B" />
        <StatCard label="Pending Interest" value={formatCurrency(summary.totalPendingInterest)} icon="clock-alert-outline" color="#B08900" />
        <StatCard label="Overdue Interest" value={formatCurrency(summary.overdueInterestAmount)} icon="clock-remove-outline" color="#B3261E" />
      </View>

      {/* Loan status distribution as simple horizontal bars — no chart lib needed */}
      <Card style={styles.section} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Loan Status Distribution
          </Text>
          {statusDist?.distribution?.every((d) => d.count === 0) ? (
            <EmptyState icon="chart-bar" title="No loans yet" />
          ) : (
            statusDist?.distribution?.map((d) => (
              <View key={d.status} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <StatusChip status={d.status} />
                  <Text variant="bodySmall" style={styles.barCount}>
                    {d.count} ({d.percentage}%)
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${d.percentage}%`,
                        backgroundColor:
                          d.status === 'active' ? '#1E3A5F' : d.status === 'overdue' ? '#B3261E' : '#6B7280',
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Overdue loans */}
      <Card style={styles.section} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Overdue Loans
          </Text>
          {overdueLoans.length === 0 ? (
            <EmptyState icon="check-circle-outline" title="No overdue loans" description="Everything is on track." />
          ) : (
            overdueLoans.map((loan, idx) => (
              <View key={loan._id}>
                {idx > 0 && <Divider />}
                <Pressable
                  style={styles.rowItem}
                  onPress={() =>
                    loan.borrower?._id &&
                    navigation.navigate('Borrowers', {
                      screen: 'BorrowerDetails',
                      params: { id: loan.borrower._id, name: loan.borrower.name },
                    })
                  }
                >
                  <View style={styles.rowItemText}>
                    <Text variant="bodyMedium" style={styles.rowTitle}>
                      {loan.borrower?.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.rowSubtitle}>
                      {loan.daysOverdue != null ? `${loan.daysOverdue} days overdue` : 'Overdue'} · Due {formatDate(loan.dueDate)}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.rowAmount}>
                    {formatCurrency(loan.principalOutstanding)}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Recent payments */}
      <Card style={styles.section} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Payments
          </Text>
          {recentPayments.length === 0 ? (
            <EmptyState icon="cash-remove" title="No payments recorded yet" />
          ) : (
            recentPayments.map((payment, idx) => (
              <View key={payment._id}>
                {idx > 0 && <Divider />}
                <View style={styles.rowItem}>
                  <View style={styles.rowItemText}>
                    <Text variant="bodyMedium" style={styles.rowTitle}>
                      {payment.borrower?.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.rowSubtitle}>
                      {formatDate(payment.paymentDate)}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.rowAmountPositive}>
                    +{formatCurrency((payment.principalPaid || 0) + (payment.interestPaid || 0))}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Top borrowers */}
      <Card style={[styles.section, styles.lastSection]} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Top Borrowers
          </Text>
          {topBorrowers.length === 0 ? (
            <EmptyState icon="account-star-outline" title="No borrowers yet" />
          ) : (
            topBorrowers.map((b, idx) => (
              <View key={b.borrowerId}>
                {idx > 0 && <Divider />}
                <Pressable
                  style={styles.rowItem}
                  onPress={() =>
                    navigation.navigate('Borrowers', {
                      screen: 'BorrowerDetails',
                      params: { id: b.borrowerId, name: b.name },
                    })
                  }
                >
                  <View style={styles.rowItemText}>
                    <Text variant="bodyMedium" style={styles.rowTitle}>
                      {b.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.rowSubtitle}>
                      {b.loanCount} loan{b.loanCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.rowAmount}>
                    {formatCurrency(b.totalLent)}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  greeting: { marginBottom: 16, fontWeight: '700', color: '#1E3A5F' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  section: { marginBottom: 16 },
  lastSection: { marginBottom: 0 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  barRow: { marginBottom: 14 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  barCount: { color: '#6B7280' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#E8EEF4', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowItemText: { flex: 1, marginRight: 8 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#6B7280', marginTop: 2 },
  rowAmount: { fontWeight: '700', color: '#1E3A5F' },
  rowAmountPositive: { fontWeight: '700', color: '#2E7D5B' },
});
