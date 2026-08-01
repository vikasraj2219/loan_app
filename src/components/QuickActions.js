import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, typography, spacing } from '../theme/tokens';

// actions: [{ icon, label, onPress, emphasized }]
export default function QuickActions({ actions }) {
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          style={[styles.action, a.emphasized ? styles.actionEmphasized : styles.actionNeutral]}
        >
          <MaterialCommunityIcons name={a.icon} size={20} color={a.emphasized ? colors.white : colors.indigo} />
          <Text style={[styles.label, a.emphasized && styles.labelEmphasized]} numberOfLines={2}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  action: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 6,
  },
  actionNeutral: { backgroundColor: colors.surface, ...shadow.sm },
  actionEmphasized: { backgroundColor: colors.indigo, ...shadow.md },
  label: { ...typography.caption, color: colors.ink, fontWeight: '700', textAlign: 'center' },
  labelEmphasized: { color: colors.white },
});
