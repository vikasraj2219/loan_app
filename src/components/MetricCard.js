import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, typography, spacing } from '../theme/tokens';

/**
 * label: e.g. "Outstanding Principal"
 * value: primary large value, e.g. "₹2,73,000"
 * supporting: e.g. "12 active loans"
 * trend: { direction: 'up' | 'down', label: '4.2% this month' } (optional)
 * tone: 'neutral' | 'teal' | 'amber' | 'coral' — colours the icon chip only
 */
const TONES = {
  neutral: { fg: colors.indigo, bg: colors.indigoSurface },
  teal: { fg: colors.teal, bg: colors.tealSurface },
  amber: { fg: colors.amber, bg: colors.amberSurface },
  coral: { fg: colors.coral, bg: colors.coralSurface },
};

export default function MetricCard({ label, value, supporting, icon, tone = 'neutral', trend, onPress }) {
  const paletteTone = TONES[tone] || TONES.neutral;
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: paletteTone.bg }]}>
          <MaterialCommunityIcons name={icon} size={18} color={paletteTone.fg} />
        </View>
        {trend ? (
          <View style={styles.trendRow}>
            <MaterialCommunityIcons
              name={trend.direction === 'up' ? 'trending-up' : 'trending-down'}
              size={13}
              color={trend.direction === 'up' ? colors.teal : colors.coral}
            />
            <Text style={[styles.trendLabel, { color: trend.direction === 'up' ? colors.teal : colors.coral }]}>
              {trend.label}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {supporting ? (
        <Text style={styles.supporting} numberOfLines={1}>
          {supporting}
        </Text>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  iconChip: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendLabel: { ...typography.caption, fontWeight: '700' },
  value: { ...typography.h1, color: colors.ink, marginBottom: 2 },
  label: { ...typography.body, color: colors.inkMuted, fontWeight: '600' },
  supporting: { ...typography.caption, color: colors.inkFaint, marginTop: 4 },
});
