import { StyleSheet, View } from 'react-native';
import { TouchableRipple, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MobileRecordCard({ title, subtitle, right, statusChip, onPress }) {
  return (
    <TouchableRipple onPress={onPress} style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text variant="bodyLarge" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {statusChip ? <View style={styles.chipWrap}>{statusChip}</View> : null}
        </View>
        {right}
        {onPress ? <MaterialCommunityIcons name="chevron-right" size={22} color="#C4CDD9" /> : null}
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  textCol: { flex: 1, marginRight: 8 },
  title: { fontWeight: '600' },
  subtitle: { color: '#6B7280', marginTop: 2 },
  chipWrap: { marginTop: 6 },
});
