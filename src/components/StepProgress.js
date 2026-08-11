import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, typography, spacing } from '../theme/tokens';

export default function StepProgress({ steps, activeIndex }) {
  return (
    <View>
      <View style={styles.track}>
        {steps.map((_, idx) => (
          <View key={idx} style={[styles.segment, idx <= activeIndex && styles.segmentActive, idx > 0 && styles.segmentSpacing]} />
        ))}
      </View>
      <Text style={styles.label}>
        Step {activeIndex + 1} of {steps.length} · {steps[activeIndex]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row' },
  segment: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.border },
  segmentActive: { backgroundColor: colors.indigo },
  segmentSpacing: { marginLeft: 6 },
  label: { ...typography.caption, color: colors.inkMuted, marginTop: spacing.sm, fontWeight: '600' },
});
