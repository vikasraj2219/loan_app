import { Chip } from 'react-native-paper';
import { statusColors } from '../theme/theme';

const LABELS = {
  active: 'Active',
  closed: 'Closed',
  overdue: 'Overdue',
  inactive: 'Inactive',
  pending: 'Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
};

export default function StatusChip({ status, compact = true }) {
  const color = statusColors[status] || '#6B7280';
  return (
    <Chip
      compact={compact}
      style={{ backgroundColor: `${color}1A`, alignSelf: 'flex-start' }}
      textStyle={{ color, fontWeight: '600', fontSize: 12 }}
    >
      {LABELS[status] || status}
    </Chip>
  );
}
