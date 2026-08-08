import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InitialsAvatar from './InitialsAvatar';
import StatusChip from './StatusChip';
import { colors, radius, shadow, typography, spacing } from '../theme/tokens';
import { formatCurrency } from '../utils/format';

export default function BorrowerCard({ borrower, onPress }) {
  const hasPending = borrower.pendingMonths > 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <InitialsAvatar name={borrower.name} size={48} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {borrower.name}
          </Text>
          <StatusChip status={borrower.status} />
        </View>
        <View style={styles.phoneRow}>
          <MaterialCommunityIcons name="phone-outline" size={13} color={colors.inkFaint} />
          <Text style={styles.phone}>{borrower.phone}</Text>
        </View>

        {hasPending ? (
          <View style={styles.pendingPill}>
            <MaterialCommunityIcons name="clock-alert-outline" size={13} color={colors.amber} />
            <Text style={styles.pendingText}>
              {formatCurrency(borrower.pendingInterestAmount)} pending · {borrower.pendingMonths} month
              {borrower.pendingMonths === 1 ? '' : 's'}
            </Text>
          </View>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  body: { flex: 1, marginLeft: spacing.md, marginRight: spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700', flexShrink: 1 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  phone: { ...typography.caption, color: colors.inkMuted },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: colors.amberSurface,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingText: { ...typography.caption, color: colors.amber, fontWeight: '700', fontSize: 11 },
});
