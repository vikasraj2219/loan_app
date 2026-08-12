import { View, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, typography, spacing } from '../theme/tokens';
import { formatCurrency, formatDate } from '../utils/format';

// payments: newest-first (as returned by the API) — this component reverses
// them to show chronological order, issued loan at top.
// onEdit/onDelete are optional (admin-only) — when provided, each payment
// node gets inline pencil/trash actions, matching the Interest Records row
// pattern, so payments can be managed right from this timeline.
export default function RepaymentTimeline({ loanAmount, loanDate, payments, remaining, onPressPayment, onEdit, onDelete }) {
  const chronological = [...payments].reverse();

  return (
    <View>
      <TimelineNode icon="cash" label="Loan Issued" caption={formatDate(loanDate)} value={formatCurrency(loanAmount)} tone="indigo" isFirst />
      {chronological.map((p, idx) => (
        <TimelineNode
          key={p._id}
          icon="check"
          label={`Payment ${idx + 1}`}
          caption={formatDate(p.paymentDate)}
          value={`-${formatCurrency((p.principalPaid || 0) + (p.interestPaid || 0))}`}
          tone="teal"
          onPress={onPressPayment ? () => onPressPayment(p) : undefined}
          onEdit={onEdit ? () => onEdit(p) : undefined}
          onDelete={onDelete ? () => onDelete(p) : undefined}
        />
      ))}
      <TimelineNode icon="flag-checkered" label="Remaining" value={formatCurrency(remaining)} tone={remaining > 0 ? 'amber' : 'teal'} isLast />
    </View>
  );
}

const TONE_COLOR = { indigo: colors.indigo, teal: colors.teal, amber: colors.amber };

function TimelineNode({ icon, label, caption, value, tone, isFirst, isLast, onPress, onEdit, onDelete }) {
  const Wrapper = onPress ? Pressable : View;
  const dotColor = TONE_COLOR[tone] || colors.indigo;
  const hasActions = onEdit || onDelete;

  return (
    <View style={styles.row}>
      <View style={styles.railCol}>
        {!isFirst && <View style={styles.railSegmentTop} />}
        <View style={[styles.dot, { backgroundColor: dotColor }]}>
          <MaterialCommunityIcons name={icon} size={11} color={colors.white} />
        </View>
        {!isLast && <View style={styles.railSegmentBottom} />}
      </View>
      <Wrapper style={styles.content} onPress={onPress}>
        <View style={styles.contentTop}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.rightSide}>
            <Text style={[styles.value, { color: dotColor }]}>{value}</Text>
            {hasActions && (
              <View style={styles.actions}>
                {onEdit && <IconButton icon="pencil-outline" size={15} style={styles.actionButton} onPress={onEdit} />}
                {onDelete && <IconButton icon="delete-outline" size={15} style={styles.actionButton} iconColor={colors.coral} onPress={onDelete} />}
              </View>
            )}
          </View>
        </View>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </Wrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  railCol: { width: 28, alignItems: 'center' },
  railSegmentTop: { width: 2, flex: 1, minHeight: 6, backgroundColor: colors.border },
  railSegmentBottom: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  content: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm },
  contentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  rightSide: { flexDirection: 'row', alignItems: 'center' },
  value: { ...typography.bodyLarge, fontWeight: '700' },
  actions: { flexDirection: 'row', marginLeft: 2 },
  actionButton: { margin: 0, width: 26, height: 26 },
  caption: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
});
