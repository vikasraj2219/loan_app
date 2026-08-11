import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, typography, spacing } from '../theme/tokens';
import { formatCurrency, formatDate } from '../utils/format';

const MODE_META = {
  cash: { icon: 'cash', label: 'Cash' },
  bank_transfer: { icon: 'bank-outline', label: 'Bank Transfer' },
  upi: { icon: 'qrcode', label: 'UPI' },
  cheque: { icon: 'checkbook', label: 'Cheque' },
  other: { icon: 'dots-horizontal', label: 'Other' },
};

export default function PaymentCard({ payment, onPress }) {
  const meta = MODE_META[payment.paymentMode] || MODE_META.other;
  const total = (payment.principalPaid || 0) + (payment.interestPaid || 0);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={meta.icon} size={18} color={colors.teal} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {payment.borrower?.name}
        </Text>
        <Text style={styles.meta}>
          {formatDate(payment.paymentDate)} · {meta.label}
        </Text>
      </View>
      <Text style={styles.amount}>+{formatCurrency(total)}</Text>
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
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.tealSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: { flex: 1, marginRight: spacing.sm },
  name: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  meta: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  amount: { ...typography.bodyLarge, color: colors.teal, fontWeight: '700' },
});
