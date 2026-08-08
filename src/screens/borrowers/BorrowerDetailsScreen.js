import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking, Pressable } from 'react-native';
import { Text, ActivityIndicator, IconButton, Menu } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borrowerApi } from '../../api/borrowerApi';
import { paymentApi } from '../../api/paymentApi';
import { documentApi } from '../../api/documentApi';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import InitialsAvatar from '../../components/InitialsAvatar';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

const TABS = ['Overview', 'Loans', 'Payments', 'Documents'];

export default function BorrowerDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [borrower, setBorrower] = useState(null);
  const [interestSummary, setInterestSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const [tab, setTab] = useState('Overview');
  const [payments, setPayments] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const loadBorrower = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const { data } = await borrowerApi.getById(id);
        setBorrower(data.data.borrower);
        setInterestSummary(data.data.interestSummary);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load borrower.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      loadBorrower();
    }, [loadBorrower])
  );

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const { data } = await paymentApi.list({ borrower: id, limit: 15, sort: '-paymentDate' });
      setPayments(data.data.payments);
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [id]);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const { data } = await documentApi.listAll({ borrower: id, limit: 15, status: 'active' });
      setDocuments(data.data.documents);
    } catch {
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, [id]);

  const selectTab = (t) => {
    setTab(t);
    if (t === 'Payments' && payments === null) loadPayments();
    if (t === 'Documents' && documents === null) loadDocuments();
  };

  const handleDeactivate = async () => {
    setMenuVisible(false);
    try {
      await borrowerApi.remove(id);
      loadBorrower();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not deactivate borrower.'));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (error && !borrower) {
    return <ErrorState message={error} onRetry={() => loadBorrower()} />;
  }

  const loans = borrower.loans || [];
  const activeLoans = loans.filter((l) => l.status !== 'closed');
  const closedLoans = loans.filter((l) => l.status === 'closed');
  const totalBorrowed = loans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.principalOutstanding || 0), 0);

  const goToLoan = (loanId) => navigation.navigate('Loans', { screen: 'LoanDetails', params: { id: loanId, borrowerName: borrower.name } });
  const goToDocuments = () =>
    navigation.navigate('More', { screen: 'Documents', params: { screen: 'DocumentUpload', params: { ownerType: 'borrower', ownerId: id, ownerName: borrower.name } } });

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBorrower(true)} colors={[colors.indigo]} />}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <InitialsAvatar name={borrower.name} size={56} />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
            >
              <Menu.Item
                leadingIcon="pencil-outline"
                title="Edit"
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('BorrowerForm', { id });
                }}
              />
              {isAdmin && borrower.status === 'active' && (
                <Menu.Item leadingIcon="account-off-outline" title="Deactivate" onPress={handleDeactivate} />
              )}
            </Menu>
          </View>
          <Text style={styles.name}>{borrower.name}</Text>
          <View style={styles.statusRow}>
            <StatusChip status={borrower.status} />
          </View>
          {borrower.email ? <Text style={styles.contactLine}>{borrower.email}</Text> : null}
          {borrower.address ? <Text style={styles.contactLine}>{borrower.address}</Text> : null}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActionsRow}>
          <QuickAction icon="phone-outline" label="Call" onPress={() => Linking.openURL(`tel:${borrower.phone}`)} />
          <QuickAction icon="message-text-outline" label="Message" onPress={() => Linking.openURL(`sms:${borrower.phone}`)} />
          <QuickAction
            icon="cash-plus"
            label="Add Loan"
            emphasized
            onPress={() => navigation.navigate('Loans', { screen: 'LoanForm', params: { selectedBorrowerId: id, selectedBorrowerName: borrower.name } })}
          />
          <QuickAction
            icon="receipt"
            label="Payment"
            onPress={() =>
              navigation.navigate('Payments', { screen: 'SelectLoanForPayment', params: { borrowerId: id, borrowerName: borrower.name } })
            }
          />
          <QuickAction icon="file-document-multiple-outline" label="Docs" onPress={goToDocuments} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => selectTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'Overview' && (
          <>
            <View style={styles.summaryGrid}>
              <SummaryTile label="Total Loans" value={String(loans.length)} icon="cash-multiple" />
              <SummaryTile label="Active Loans" value={String(activeLoans.length)} icon="check-decagram" tone="teal" />
              <SummaryTile label="Closed Loans" value={String(closedLoans.length)} icon="archive-outline" tone="slate" />
              <SummaryTile label="Total Borrowed" value={formatCurrency(totalBorrowed)} icon="cash" />
              <SummaryTile label="Outstanding Principal" value={formatCurrency(totalOutstanding)} icon="chart-line" tone="indigo" />
              <SummaryTile
                label="Pending Interest"
                value={formatCurrency(interestSummary?.pendingInterestAmount)}
                icon="clock-alert-outline"
                tone="amber"
              />
            </View>

            {interestSummary?.pendingMonths > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Interest Status</Text>
                <Row label="Pending Months" value={String(interestSummary.pendingMonths)} />
                <Row label="Next Due" value={formatDate(interestSummary.nextInterestDueDate)} />
                <Row label="Last Paid" value={formatDate(interestSummary.lastInterestPaidOn)} />
              </View>
            )}

            {(borrower.occupation || borrower.guarantorName || borrower.idProofNumber) && (
              <View style={[styles.sectionCard, styles.lastSection]}>
                <Text style={styles.sectionTitle}>Additional Details</Text>
                {borrower.occupation ? <Row label="Occupation" value={borrower.occupation} /> : null}
                {borrower.idProofNumber ? <Row label="ID Proof" value={`${borrower.idProofType} · ${borrower.idProofNumber}`} /> : null}
                {borrower.guarantorName ? (
                  <Row label="Guarantor" value={`${borrower.guarantorName}${borrower.guarantorPhone ? ' · ' + borrower.guarantorPhone : ''}`} />
                ) : null}
              </View>
            )}
          </>
        )}

        {tab === 'Loans' && (
          <View style={[styles.sectionCard, styles.lastSection]}>
            {loans.length === 0 ? (
              <EmptyState icon="cash-multiple" title="No loans yet" description="Tap Add Loan above to create one." />
            ) : (
              loans.map((loan) => (
                <Pressable key={loan._id} style={styles.listRow} onPress={() => goToLoan(loan._id)}>
                  <View style={styles.listRowText}>
                    <Text style={styles.listRowTitle}>{formatCurrency(loan.loanAmount)}</Text>
                    <Text style={styles.listRowSubtitle}>
                      {loan.interestRate}% monthly · Outstanding {formatCurrency(loan.principalOutstanding)}
                    </Text>
                  </View>
                  <StatusChip status={loan.status} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {tab === 'Payments' && (
          <View style={[styles.sectionCard, styles.lastSection]}>
            {paymentsLoading ? (
              <ActivityIndicator color={colors.indigo} style={styles.tabLoader} />
            ) : !payments || payments.length === 0 ? (
              <EmptyState icon="cash-remove" title="No payments recorded yet" />
            ) : (
              payments.map((p) => (
                <View key={p._id} style={styles.listRow}>
                  <View style={styles.listRowText}>
                    <Text style={styles.listRowTitle}>{formatDate(p.paymentDate)}</Text>
                    <Text style={styles.listRowSubtitle}>{p.paymentMode}</Text>
                  </View>
                  <Text style={styles.paymentAmount}>+{formatCurrency((p.principalPaid || 0) + (p.interestPaid || 0))}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'Documents' && (
          <View style={[styles.sectionCard, styles.lastSection]}>
            {documentsLoading ? (
              <ActivityIndicator color={colors.indigo} style={styles.tabLoader} />
            ) : !documents || documents.length === 0 ? (
              <EmptyState icon="file-document-outline" title="No documents yet" description="Tap Docs above to upload one." />
            ) : (
              documents.map((d) => (
                <Pressable
                  key={d._id}
                  style={styles.listRow}
                  onPress={() =>
                    navigation.navigate('More', { screen: 'Documents', params: { screen: 'DocumentDetails', params: { document: d } } })
                  }
                >
                  <MaterialCommunityIcons
                    name={d.resourceType === 'image' ? 'file-image-outline' : 'file-pdf-box'}
                    size={20}
                    color={colors.inkMuted}
                    style={{ marginRight: 10 }}
                  />
                  <View style={styles.listRowText}>
                    <Text style={styles.listRowTitle} numberOfLines={1}>
                      {d.documentName}
                    </Text>
                    <Text style={styles.listRowSubtitle}>
                      {d.category} · {formatDate(d.createdAt)}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, onPress, emphasized }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, emphasized && styles.quickActionIconEmphasized]}>
        <MaterialCommunityIcons name={icon} size={18} color={emphasized ? colors.white : colors.indigo} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryTile({ label, value, icon, tone = 'indigo' }) {
  const toneColor = { indigo: colors.indigo, teal: colors.teal, amber: colors.amber, slate: colors.slate }[tone];
  return (
    <View style={styles.summaryTile}>
      <MaterialCommunityIcons name={icon} size={16} color={toneColor} />
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  headerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { ...typography.h1, color: colors.ink, marginTop: spacing.sm },
  statusRow: { marginTop: 6, marginBottom: 6 },
  contactLine: { ...typography.body, color: colors.inkMuted, marginTop: 2 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  quickAction: { alignItems: 'center', width: 60 },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  quickActionIconEmphasized: { backgroundColor: colors.indigo },
  quickActionLabel: { ...typography.caption, color: colors.inkMuted, marginTop: 6, fontSize: 11, textAlign: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface, ...shadow.sm },
  tabLabel: { ...typography.caption, color: colors.inkMuted, fontWeight: '700' },
  tabLabelActive: { color: colors.indigo },
  tabLoader: { marginVertical: 24 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.md },
  summaryTile: {
    width: '31.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  summaryValue: { ...typography.h3, color: colors.ink, marginTop: 6 },
  summaryLabel: { ...typography.caption, color: colors.inkMuted, marginTop: 2, fontSize: 10 },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  lastSection: { marginBottom: 0 },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { ...typography.caption, color: colors.inkMuted },
  rowValue: { ...typography.body, color: colors.ink, fontWeight: '600' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listRowText: { flex: 1, marginRight: 8 },
  listRowTitle: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  listRowSubtitle: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  paymentAmount: { ...typography.bodyLarge, color: colors.teal, fontWeight: '700' },
});
