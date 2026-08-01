import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import MetricCard from '../../components/MetricCard';
import PortfolioHero from '../../components/PortfolioHero';
import AttentionCenter from '../../components/AttentionCenter';
import QuickActions from '../../components/QuickActions';
import StatusChip from '../../components/StatusChip';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen({ navigation }) {
  const { user, isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (error && !summary) {
    return <ErrorState message={error} onRetry={() => loadData()} />;
  }

  const goToBorrower = (id, name) =>
    navigation.navigate('Borrowers', { screen: 'BorrowerDetails', params: { id, name } });

  const attentionItems = [
    summary.overdueLoans > 0 && {
      tone: 'coral',
      title: `${summary.overdueLoans} Overdue Loan${summary.overdueLoans === 1 ? '' : 's'}`,
      subtitle: `${formatCurrency(summary.overdueInterestAmount)} in overdue interest`,
      onPress: () => navigation.navigate('Loans', { screen: 'LoansList' }),
    },
    summary.totalPendingInterest > 0 && {
      tone: 'amber',
      title: 'Pending Interest',
      subtitle: `${formatCurrency(summary.totalPendingInterest)} awaiting collection`,
      onPress: () => navigation.navigate('More', { screen: 'Reports', params: { screen: 'PendingInterest' } }),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.indigo]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
          </Text>
          <Text style={styles.subGreeting}>Here's how your portfolio is doing</Text>
        </View>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name={isAdmin ? 'shield-crown-outline' : 'account-outline'} size={14} color={colors.indigo} />
        </View>
      </View>

      <PortfolioHero
        outstandingPrincipal={formatCurrency(summary.outstandingPrincipal)}
        activeLoans={summary.activeLoans}
        totalBorrowers={summary.totalBorrowers}
      />

      <AttentionCenter items={attentionItems} />

      <QuickActions
        actions={[
          {
            icon: 'account-plus-outline',
            label: 'Add Borrower',
            onPress: () => navigation.navigate('Borrowers', { screen: 'BorrowerForm' }),
          },
          {
            icon: 'cash-plus',
            label: 'New Loan',
            emphasized: true,
            onPress: () => navigation.navigate('Loans', { screen: 'LoanForm' }),
          },
          {
            icon: 'receipt',
            label: 'Record Payment',
            onPress: () => navigation.navigate('Payments', { screen: 'SelectBorrowerForPayment' }),
          },
        ]}
      />

      <Text style={styles.sectionHeading}>Overview</Text>
      <View style={styles.statsGrid}>
        <MetricCard label="Today's Collection" value={formatCurrency(summary.todaysCollection)} supporting="Collected today" icon="cash-plus" tone="teal" />
        <MetricCard label="This Month" value={formatCurrency(summary.monthlyCollection)} supporting="Month to date" icon="calendar-month-outline" tone="teal" />
        <MetricCard label="Pending Interest" value={formatCurrency(summary.totalPendingInterest)} supporting="Needs attention" icon="clock-alert-outline" tone="amber" />
        <MetricCard label="Overdue Interest" value={formatCurrency(summary.overdueInterestAmount)} supporting="Requires collection" icon="clock-remove-outline" tone="coral" />
      </View>

      {/* Loan status distribution */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Loan Portfolio Distribution</Text>
        {statusDist?.distribution?.every((d) => d.count === 0) ? (
          <EmptyState icon="chart-bar" title="No loans yet" />
        ) : (
          statusDist?.distribution?.map((d) => (
            <View key={d.status} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <StatusChip status={d.status} />
                <Text style={styles.barCount}>
                  {d.count} ({d.percentage}%)
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${d.percentage}%`,
                      backgroundColor: d.status === 'active' ? colors.indigo : d.status === 'overdue' ? colors.coral : colors.slate,
                    },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Overdue loans */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Overdue Loans</Text>
        {overdueLoans.length === 0 ? (
          <EmptyState icon="check-circle-outline" title="No overdue loans" description="Everything is on track." />
        ) : (
          overdueLoans.map((loan) => (
            <Pressable
              key={loan._id}
              style={styles.rowItem}
              onPress={() => loan.borrower?._id && goToBorrower(loan.borrower._id, loan.borrower.name)}
            >
              <View style={styles.rowItemText}>
                <Text style={styles.rowTitle}>{loan.borrower?.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {loan.daysOverdue != null ? `${loan.daysOverdue} days overdue` : 'Overdue'} · Due {formatDate(loan.dueDate)}
                </Text>
              </View>
              <Text style={styles.rowAmountCoral}>{formatCurrency(loan.principalOutstanding)}</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Recent payments */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {recentPayments.length === 0 ? (
          <EmptyState icon="cash-remove" title="No payments recorded yet" />
        ) : (
          recentPayments.map((payment) => (
            <View key={payment._id} style={styles.rowItem}>
              <View style={styles.rowItemText}>
                <Text style={styles.rowTitle}>{payment.borrower?.name}</Text>
                <Text style={styles.rowSubtitle}>{formatDate(payment.paymentDate)}</Text>
              </View>
              <Text style={styles.rowAmountTeal}>
                +{formatCurrency((payment.principalPaid || 0) + (payment.interestPaid || 0))}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Top borrowers */}
      <View style={[styles.sectionCard, styles.lastSection]}>
        <Text style={styles.sectionTitle}>Top Borrowers</Text>
        {topBorrowers.length === 0 ? (
          <EmptyState icon="account-star-outline" title="No borrowers yet" />
        ) : (
          topBorrowers.map((b) => (
            <Pressable key={b.borrowerId} style={styles.rowItem} onPress={() => goToBorrower(b.borrowerId, b.name)}>
              <View style={styles.rowItemText}>
                <Text style={styles.rowTitle}>{b.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {b.loanCount} loan{b.loanCount === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={styles.rowAmountIndigo}>{formatCurrency(b.totalLent)}</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { ...typography.h1, color: colors.ink },
  subGreeting: { ...typography.body, color: colors.inkMuted, marginTop: 2 },
  roleBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.indigoSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sectionHeading: { ...typography.h3, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  lastSection: { marginBottom: 0 },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  barRow: { marginBottom: 14 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  barCount: { ...typography.caption, color: colors.inkMuted },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowItemText: { flex: 1, marginRight: 8 },
  rowTitle: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  rowSubtitle: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  rowAmountIndigo: { ...typography.bodyLarge, fontWeight: '700', color: colors.indigo },
  rowAmountTeal: { ...typography.bodyLarge, fontWeight: '700', color: colors.teal },
  rowAmountCoral: { ...typography.bodyLarge, fontWeight: '700', color: colors.coral },
});
