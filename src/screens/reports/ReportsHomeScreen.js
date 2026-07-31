import { View, StyleSheet } from 'react-native';
import { List, Divider } from 'react-native-paper';

const REPORTS = [
  {
    key: 'Collections',
    title: 'Collection Report',
    description: 'Payments received, filterable by date, with CSV/Excel/PDF export',
    icon: 'cash-check',
  },
  {
    key: 'PendingInterest',
    title: 'Pending Interest',
    description: 'Borrowers and months with unpaid interest',
    icon: 'clock-alert-outline',
  },
  {
    key: 'OverdueInterest',
    title: 'Overdue Interest',
    description: 'Pending interest past its due date',
    icon: 'clock-remove-outline',
  },
  {
    key: 'InterestHistory',
    title: 'Interest Collection History',
    description: 'Interest generated vs. actually collected, month by month',
    icon: 'chart-timeline-variant',
  },
];

export default function ReportsHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {REPORTS.map((r, idx) => (
        <View key={r.key}>
          {idx > 0 && <Divider />}
          <List.Item
            title={r.title}
            description={r.description}
            left={(props) => <List.Icon {...props} icon={r.icon} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate(r.key)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
});
