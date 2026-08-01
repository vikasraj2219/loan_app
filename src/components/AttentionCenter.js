import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, typography, spacing } from '../theme/tokens';

// items: [{ icon, tone: 'coral'|'amber'|'indigo', title, subtitle, onPress }]
export default function AttentionCenter({ items }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="bell-ring-outline" size={16} color={colors.coral} />
        <Text style={styles.header}>ATTENTION REQUIRED</Text>
      </View>
      {visible.map((item, idx) => (
        <Pressable
          key={idx}
          onPress={item.onPress}
          style={[styles.row, idx < visible.length - 1 && styles.rowDivider]}
        >
          <View style={[styles.dot, { backgroundColor: TONE_COLOR[item.tone] }]} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.inkFaint} />
        </Pressable>
      ))}
    </View>
  );
}

const TONE_COLOR = { coral: colors.coral, amber: colors.amber, indigo: colors.indigo };

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  header: { ...typography.overline, color: colors.coral },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  rowText: { flex: 1 },
  rowTitle: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  rowSubtitle: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
});
