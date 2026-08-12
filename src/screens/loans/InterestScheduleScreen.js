import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text, ActivityIndicator, Button, Dialog, Portal, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loanApi } from '../../api/loanApi';
import { interestApi } from '../../api/interestApi';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function InterestScheduleScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [months, setMonths] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data } = await interestApi.generate({ loanId: id });
      setGenerateResult(data.data.summary);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not generate interest records.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await interestApi.deleteRecord(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the record.'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (error && months.length === 0) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.indigo]} />}
      >
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <SummaryItem label="Pending Months" value={String(summary.pendingMonths)} />
              <SummaryItem label="Pending Amount" value={formatCurrency(summary.pendingInterestAmount)} tone="amber" />
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <SummaryItem label="Next Due" value={formatDate(summary.nextInterestDueDate)} small />
              <SummaryItem label="Last Paid" value={formatDate(summary.lastInterestPaidOn)} small />
            </View>
          </View>
        )}

        {isAdmin && (
          <Button
            mode="contained-tonal"
            icon="refresh"
            onPress={handleGenerate}
            loading={generating}
            disabled={generating}
            style={styles.generateButton}
          >
            Generate Missing Interest Records
          </Button>
        )}
        {!!error && (
          <Text style={styles.inlineError}>{error}</Text>
        )}

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>Month-by-Month Schedule</Text>
          {isAdmin && (
            <Pressable
              style={styles.addRecordButton}
              onPress={() => navigation.navigate('InterestRecordForm', { loanId: id })}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.indigo} />
              <Text style={styles.addRecordText}>Add Record</Text>
            </Pressable>
          )}
        </View>

        {months.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState
              icon="calendar-blank-outline"
              title="No interest generated yet"
              description={
                isAdmin
                  ? 'Tap "Generate Missing Interest Records" above to create every month owed so far, or add one manually.'
                  : 'Interest for the first month appears one month after the loan date.'
              }
            />
          </View>
        ) : (
          months.map((m) => (
            <View key={m._id} style={styles.monthCard}>
              <View style={styles.monthCardLeft}>
                <View style={[styles.monthIconWrap, { backgroundColor: STATUS_TINT[m.status] || colors.surfaceAlt }]}>
                  <Text style={[styles.monthShort, { color: STATUS_FG[m.status] || colors.inkMuted }]}>{MONTH_NAMES[m.month]}</Text>
                </View>
              </View>
              <View style={styles.monthCardBody}>
                <View style={styles.monthCardTopRow}>
                  <Text style={styles.monthTitle}>
                    {MONTH_NAMES[m.month]} {m.year}
                  </Text>
                  <View style={styles.monthCardTopRight}>
                    <StatusChip status={m.status} />
                    {isAdmin && (
                      <View style={styles.rowActions}>
                        <IconButton
                          icon="pencil-outline"
                          size={16}
                          style={styles.rowActionButton}
                          onPress={() => navigation.navigate('InterestRecordForm', { loanId: id, recordId: m._id })}
                        />
                        <IconButton icon="delete-outline" size={16} style={styles.rowActionButton} iconColor={colors.coral} onPress={() => setDeleteTarget(m)} />
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.monthMeta}>
                  {formatCurrency(m.principalOutstandingAtCharge)} principal · {m.interestRateAtCharge}% rate
                </Text>
                <View style={styles.monthBottomRow}>
                  <Text style={styles.monthAmount}>{formatCurrency(m.interestAmount)}</Text>
                  <Text style={styles.monthDue}>
                    Due {formatDate(m.dueDate)}
                    {m.paidDate ? ` · Paid ${formatDate(m.paidDate)}` : ''}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={!!generateResult} onDismiss={() => setGenerateResult(null)}>
          <Dialog.Title>Interest Generated</Dialog.Title>
          <Dialog.Content>
            {generateResult && (
              <View>
                <Text style={styles.dialogRow}>{generateResult.recordsCreated} new record(s) created</Text>
                <Text style={styles.dialogRow}>{generateResult.duplicatesSkipped} already existed (skipped)</Text>
                {generateResult.failed > 0 ? (
                  <Text style={[styles.dialogRow, { color: colors.coral }]}>{generateResult.failed} failed</Text>
                ) : null}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setGenerateResult(null)}>OK</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Record</Dialog.Title>
          <Dialog.Content>
            <Text>
              Delete the {deleteTarget ? `${MONTH_NAMES[deleteTarget.month]} ${deleteTarget.year}` : ''} interest record? This cannot be
              undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onPress={handleDelete} loading={deleting} disabled={deleting} textColor={colors.coral}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const STATUS_TINT = { paid: colors.tealSurface, pending: colors.amberSurface, overdue: colors.coralSurface };
const STATUS_FG = { paid: colors.teal, pending: colors.amber, overdue: colors.coral };

function SummaryItem({ label, value, tone, small }) {
  const toneColor = tone === 'amber' ? colors.amber : colors.ink;
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[small ? styles.summaryValueSmall : styles.summaryValue, { color: toneColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 110 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.sm },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1 },
  summaryLabel: { ...typography.caption, color: colors.inkFaint, marginBottom: 3 },
  summaryValue: { ...typography.h1, fontSize: 22 },
  summaryValueSmall: { ...typography.bodyLarge, fontWeight: '700', color: colors.ink },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  generateButton: { marginBottom: spacing.md },
  inlineError: { ...typography.caption, color: colors.coral, marginBottom: spacing.md },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionHeading: { ...typography.h3, color: colors.ink },
  addRecordButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addRecordText: { ...typography.label, color: colors.indigo, fontWeight: '700' },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.sm },
  monthCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  monthCardLeft: { marginRight: spacing.md },
  monthIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  monthShort: { ...typography.label, fontWeight: '800' },
  monthCardBody: { flex: 1 },
  monthCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthCardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowActions: { flexDirection: 'row' },
  rowActionButton: { margin: 0 },
  monthTitle: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  monthMeta: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  monthBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  monthAmount: { ...typography.h3, color: colors.ink },
  monthDue: { ...typography.caption, color: colors.inkFaint },
  dialogRow: { ...typography.body, color: colors.ink, marginBottom: 4 },
});
