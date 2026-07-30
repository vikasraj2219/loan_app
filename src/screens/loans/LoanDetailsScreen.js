import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, Menu, IconButton, Banner } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { loanApi } from '../../api/loanApi';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function LoanDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadLoan = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const { data } = await loanApi.getById(id);
        setLoan(data.data.loan);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load loan.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      loadLoan();
    }, [loadLoan])
  );

  const handleClose = async () => {
    setMenuVisible(false);
    setActionError('');
    setActionLoading(true);
    try {
      await loanApi.close(id);
      loadLoan();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not close loan.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOverdue = async () => {
    setMenuVisible(false);
    setActionError('');
    setActionLoading(true);
    try {
      await loanApi.markOverdue(id);
      loadLoan();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not mark loan overdue.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (error && !loan) {
    return <ErrorState message={error} onRetry={() => loadLoan()} />;
  }

  const pendingInterest = Math.max((loan.totalInterestAccrued || 0) - (loan.totalInterestPaid || 0), 0);
  const currentMonthlyInterest = Math.round((loan.principalOutstanding * loan.interestRate) / 100);
  const totalOutstanding = loan.principalOutstanding + pendingInterest;

  return (
    <View style={styles.flex}>
      {!!actionError && (
        <Banner visible icon="alert-circle-outline" actions={[{ label: 'Dismiss', onPress: () => setActionError('') }]}>
          {actionError}
        </Banner>
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLoan(true)} colors={['#1E3A5F']} />}
      >
        <Card style={styles.headerCard} mode="elevated">
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text variant="titleLarge" style={styles.amount}>
                  {formatCurrency(loan.loanAmount)}
                </Text>
                <StatusChip status={loan.status} />
              </View>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} disabled={actionLoading} />}
              >
                <Menu.Item
                  leadingIcon="pencil-outline"
                  title="Edit"
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('LoanForm', { id });
                  }}
                />
                <Menu.Item
                  leadingIcon="calendar-clock-outline"
                  title="Interest Schedule"
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('InterestSchedule', { id, borrowerName: loan.borrower?.name });
                  }}
                />
                <Menu.Item
                  leadingIcon="file-document-multiple-outline"
                  title="Documents"
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('More', {
                      screen: 'Documents',
                      params: {
                        screen: 'DocumentUpload',
                        params: { ownerType: 'loan', ownerId: id, ownerName: `${loan.borrower?.name} loan` },
                      },
                    });
                  }}
                />
                {loan.status !== 'closed' && (
                  <Menu.Item
                    leadingIcon="cash-plus"
                    title="Record Payment"
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate('Payments', {
                        screen: 'PaymentForm',
                        params: {
                          loanId: id,
                          borrowerName: loan.borrower?.name,
                          principalOutstanding: loan.principalOutstanding,
                        },
                      });
                    }}
                  />
                )}
                {loan.status !== 'closed' && loan.principalOutstanding === 0 && (
                  <Menu.Item leadingIcon="check-circle-outline" title="Close Loan" onPress={handleClose} />
                )}
                {isAdmin && loan.status === 'active' && (
                  <Menu.Item leadingIcon="alert-outline" title="Mark Overdue" onPress={handleMarkOverdue} />
                )}
              </Menu>
            </View>
            <Text variant="bodyMedium" style={styles.borrowerLink}>
              {loan.borrower?.name} · {loan.borrower?.phone}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.section} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Loan Summary
            </Text>
            <View style={styles.summaryGrid}>
              <SummaryItem label="Principal Outstanding" value={formatCurrency(loan.principalOutstanding)} />
              <SummaryItem label="Interest Rate" value={`${loan.interestRate}% / month`} />
              <SummaryItem label="This Month's Interest" value={formatCurrency(currentMonthlyInterest)} />
              <SummaryItem label="Pending Interest" value={formatCurrency(pendingInterest)} color="#B08900" />
              <SummaryItem label="Total Outstanding" value={formatCurrency(totalOutstanding)} color="#1E3A5F" />
              <SummaryItem label="Principal Paid" value={formatCurrency(loan.totalPrincipalPaid)} color="#2E7D5B" />
              <SummaryItem label="Loan Date" value={formatDate(loan.loanDate)} />
              <SummaryItem label="Due Date" value={formatDate(loan.dueDate)} />
            </View>
            {loan.notes ? (
              <>
                <Divider style={styles.notesDivider} />
                <Text variant="bodySmall" style={styles.notesLabel}>
                  Notes
                </Text>
                <Text variant="bodyMedium">{loan.notes}</Text>
              </>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={[styles.section, styles.lastSection]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Payment History
            </Text>
            {!loan.payments || loan.payments.length === 0 ? (
              <EmptyState icon="cash-remove" title="No payments yet" description="Payments module arrives in Phase 4." />
            ) : (
              loan.payments.map((payment, idx) => (
                <View key={payment._id}>
                  {idx > 0 && <Divider />}
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentRowText}>
                      <Text variant="bodyMedium" style={styles.rowTitle}>
                        {formatDate(payment.paymentDate)}
                      </Text>
                      <Text variant="bodySmall" style={styles.rowSubtitle}>
                        Principal {formatCurrency(payment.principalPaid)} · Interest {formatCurrency(payment.interestPaid)}
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
      </ScrollView>
    </View>
  );
}

function SummaryItem({ label, value, color }) {
  return (
    <View style={styles.summaryItem}>
      <Text variant="bodySmall" style={styles.summaryLabel}>
        {label}
      </Text>
      <Text variant="titleMedium" style={[styles.summaryValue, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  headerCard: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1, gap: 6 },
  amount: { fontWeight: '700', color: '#1E3A5F' },
  borrowerLink: { marginTop: 8, color: '#3A4453' },
  section: { marginBottom: 16 },
  lastSection: { marginBottom: 0 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryItem: { width: '50%', marginBottom: 14 },
  summaryLabel: { color: '#6B7280', marginBottom: 2 },
  summaryValue: { fontWeight: '700', color: '#1E3A5F' },
  notesDivider: { marginVertical: 12 },
  notesLabel: { color: '#6B7280', marginBottom: 4 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  paymentRowText: { flex: 1 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#6B7280', marginTop: 2 },
  rowAmountPositive: { fontWeight: '700', color: '#2E7D5B' },
});
