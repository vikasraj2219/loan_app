import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statusPalette, statusLabels, radius, typography } from '../theme/tokens';

// A status "badge" rather than a plain coloured chip — icon + label together
// so status never relies on colour alone (accessibility requirement from
// the design brief), with a soft tinted background instead of a solid fill.
export default function StatusChip({ status, compact = true }) {
  const entry = statusPalette[status] || statusPalette.closed;
  const label = statusLabels[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: entry.bg }, compact && styles.badgeCompact]}>
      <MaterialCommunityIcons name={entry.icon} size={compact ? 12 : 14} color={entry.fg} />
      <Text style={[styles.label, { color: entry.fg }, compact && styles.labelCompact]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  badgeCompact: { paddingHorizontal: 8, paddingVertical: 3 },
  label: { ...typography.caption, fontWeight: '700' },
  labelCompact: { fontSize: 11 },
});
