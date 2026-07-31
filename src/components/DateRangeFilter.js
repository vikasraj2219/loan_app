import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

export default function DateRangeFilter({ dateFrom, dateTo, onChangeFrom, onChangeTo, onApply }) {
  return (
    <View style={styles.row}>
      <TextInput
        label="From (YYYY-MM-DD)"
        value={dateFrom}
        onChangeText={onChangeFrom}
        mode="outlined"
        dense
        style={styles.input}
      />
      <TextInput label="To (YYYY-MM-DD)" value={dateTo} onChangeText={onChangeTo} mode="outlined" dense style={styles.input} />
      <Button mode="contained-tonal" onPress={onApply} style={styles.applyButton} compact>
        Apply
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 8, backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#fff' },
  applyButton: { marginTop: 6 },
});
