import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text, ActivityIndicator, Menu, IconButton, Banner, Dialog, Portal, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loanApi } from '../../api/loanApi';
import { paymentApi } from '../../api/paymentApi';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import RepaymentProgress from '../../components/RepaymentProgress';
import RepaymentTimeline from '../../components/RepaymentTimeline';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

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
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

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

  const handleDeletePayment = async () => {
    if (!deletePaymentTarget) return;
    setDeletingPayment(true);
    try {
      await paymentApi.remove(deletePaymentTarget._id);
      setDeletePaymentTarget(null);
      loadLoan();
    } catch (err) {
      setDeletePaymentTarget(null);
      setActionError(getErrorMessage(err, 'Could not delete payment.'));
    } finally {
      setDeletingPayment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (error && !loan) {
    return <ErrorState message={error} onRetry={() => loadLoan()} />;
  }

  const pendingInterest = Math.max((loan.totalInterestAccrued || 0) - (loan.totalInterestPaid || 0), 0);
  const currentMonthlyInterest = Math.round((loan.principalOutstanding * loan.interestRate) / 100);
  const totalOutstanding = loan.principalOutstanding + pendingInterest;
  const payments = loan.payments || [];

  return (
    <View style={styles.flex}>
      {!!actionError && (
        <Banner visible icon="alert-circle-outline" actions={[{ label: 'Dismiss', onPress: () => setActionError('') }]}>
          {actionError}
        </Banner>
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLoan(true)} colors={[colors.indigo]} />}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerText}>
              <Text style={styles.borrowerName}>{loan.borrower?.name}</Text>
              <Text style={styles.loanIdText}>Loan #{id.slice(-6).toUpperCase()}</Text>
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
                    params: { screen: 'DocumentUpload', params: { ownerType: 'loan', ownerId: id, ownerName: `${loan.borrower?.name} loan` } },
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
                      params: { loanId: id, borrowerName: loan.borrower?.name, principalOutstanding: loan.principalOutstanding },
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
          <StatusChip status={loan.status} />

          <View style={styles.progressWrap}>
            <RepaymentProgress loanAmount={loan.loanAmount} outstanding={loan.principalOutstanding} />
          </View>
        </View>

        {/* Info grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <View style={styles.infoGrid}>
            <InfoTile label="Loan Date" value={formatDate(loan.loanDate)} />
            <InfoTile label="Interest Rate" value={`${loan.interestRate}% / month`} />
            {loan.tenureMonths ? <InfoTile label="Tenure" value={`${loan.tenureMonths} months`} /> : null}
            <InfoTile label="Due Date" value={formatDate(loan.dueDate)} />
            <InfoTile label="This Month's Interest" value={formatCurrency(currentMonthlyInterest)} />
            <InfoTile label="Pending Interest" value={formatCurrency(pendingInterest)} tone="amber" />
            <InfoTile label="Total Outstanding" value={formatCurrency(totalOutstanding)} tone="indigo" />
            <InfoTile label="Principal Paid" value={formatCurrency(loan.totalPrincipalPaid)} tone="teal" />
          </View>
          {loan.notes ? (
            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{loan.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Repayment timeline */}
        <View style={[styles.sectionCard, styles.lastSection]}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Payment Records</Text>
            {loan.status !== 'closed' && (
              <Pressable
                style={styles.addRecordButton}
                onPress={() =>
                  navigation.navigate('Payments', {
                    screen: 'PaymentForm',
                    params: { loanId: id, borrowerName: loan.borrower?.name, principalOutstanding: loan.principalOutstanding },
                  })
                }
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.indigo} />
                <Text style={styles.addRecordText}>Record Payment</Text>
              </Pressable>
            )}
          </View>
          {payments.length === 0 ? (
            <EmptyState icon="cash-remove" title="No payments yet" description="Record a payment to start tracking repayments." />
          ) : (
            <RepaymentTimeline
              loanAmount={loan.loanAmount}
              loanDate={loan.loanDate}
              payments={payments}
              remaining={loan.principalOutstanding}
              onPressPayment={(p) =>
                navigation.navigate('Payments', { screen: 'PaymentDetails', params: { id: p._id, borrowerName: loan.borrower?.name } })
              }
              onEdit={
                isAdmin
                  ? (p) => navigation.navigate('Payments', { screen: 'PaymentEdit', params: { id: p._id } })
                  : undefined
              }
              onDelete={isAdmin ? (p) => setDeletePaymentTarget(p) : undefined}
            />
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={!!deletePaymentTarget} onDismiss={() => setDeletePaymentTarget(null)}>
          <Dialog.Title>Delete Payment</Dialog.Title>
          <Dialog.Content>
            <Text>This permanently reverses this payment's effect on the loan balance and interest ledger. This cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeletePaymentTarget(null)}>Cancel</Button>
            <Button onPress={handleDeletePayment} loading={deletingPayment} disabled={deletingPayment} textColor={colors.coral}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function InfoTile({ label, value, tone }) {
  const toneColor = tone ? { amber: colors.amber, indigo: colors.indigo, teal: colors.teal }[tone] : colors.ink;
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: toneColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 110 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  headerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1 },
  borrowerName: { ...typography.h2, color: colors.ink },
  loanIdText: { ...typography.caption, color: colors.inkFaint, marginTop: 2 },
  progressWrap: { marginTop: spacing.lg },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  lastSection: { marginBottom: 0 },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  addRecordButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addRecordText: { ...typography.label, color: colors.indigo, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoTile: { width: '48%', marginBottom: spacing.md },
  infoLabel: { ...typography.caption, color: colors.inkFaint, marginBottom: 3 },
  infoValue: { ...typography.h3, fontSize: 16 },
  notesBlock: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  notesLabel: { ...typography.caption, color: colors.inkFaint, marginBottom: 4 },
  notesText: { ...typography.body, color: colors.ink },
});
