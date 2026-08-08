import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, typography } from '../theme/tokens';

const PALETTE = [colors.indigo, colors.teal, colors.amber, colors.coral, colors.midnight];

function hashToIndex(str = '', mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000;
  return h % mod;
}

export default function Avatar({ name = '', size = 44 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const bg = PALETTE[hashToIndex(name, PALETTE.length)];

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { ...typography.label, color: colors.white, fontWeight: '800' },
});
