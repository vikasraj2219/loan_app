import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, typography } from '../theme/tokens';

const PALETTE = [colors.indigo, colors.teal, colors.amber, colors.coral, colors.indigoLight];

function colorFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function InitialsAvatar({ name = '', size = 48 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
  const bg = colorFor(name);

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${bg}1F` }]}>
      <Text style={[styles.label, { color: bg, fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.h3, fontWeight: '800' },
});
