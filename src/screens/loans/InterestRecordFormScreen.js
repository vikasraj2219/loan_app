import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { interestApi } from '../../api/interestApi';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, typography, spacing } from '../../theme/tokens';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function InterestRecordFormScreen({ route, navigation }) {
  const { loanId, recordId } = route.params;
  const isEdit = !!recordId;

  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [principalOutstandingAtCharge, setPrincipalOutstandingAtCharge] = useState('');
  const [interestRateAtCharge, setInterestRateAtCharge] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Interest Record' : 'Add Interest Record' });
  }, [isEdit, navigation]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await interestApi.getRecord(recordId);
        const r = data.data.record;
        setMonth(String(r.month));
        setYear(String(r.year));
        setDueDate(r.dueDate ? r.dueDate.slice(0, 10) : '');
        setInterestAmount(String(r.interestAmount ?? ''));
        setPaidAmount(String(r.paidAmount ?? 0));
        setPrincipalOutstandingAtCharge(String(r.principalOutstandingAtCharge ?? ''));
        setInterestRateAtCharge(String(r.interestRateAtCharge ?? ''));
        setRemarks(r.remarks || '');
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load record.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, recordId]);

  const validate = () => {
    if (!isEdit) {
      if (!month || Number(month) < 1 || Number(month) > 12) return 'Month must be between 1 and 12.';
      if (!year || Number(year) < 2000) return 'Enter a valid year.';
      if (!dueDate || !ISO_DATE_RE.test(dueDate)) return 'Due date is required, in YYYY-MM-DD format.';
    } else if (dueDate && !ISO_DATE_RE.test(dueDate)) {
      return 'Due date must be in YYYY-MM-DD format.';
    }
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        const payload = {};
        if (month) payload.month = Number(month);
        if (year) payload.year = Number(year);
        if (dueDate) payload.dueDate = dueDate;
        if (interestAmount !== '') payload.interestAmount = Number(interestAmount);
        if (paidAmount !== '') payload.paidAmount = Number(paidAmount);
        if (principalOutstandingAtCharge !== '') payload.principalOutstandingAtCharge = Number(principalOutstandingAtCharge);
        if (interestRateAtCharge !== '') payload.interestRateAtCharge = Number(interestRateAtCharge);
        payload.remarks = remarks.trim();
        await interestApi.updateRecord(recordId, payload);
      } else {
        const payload = { loan: loanId, month: Number(month), year: Number(year), dueDate };
        // interestAmount/principal/rate are optional — the backend computes
        // them from the loan's actual outstanding principal as of dueDate
        // when left blank, which is usually the right answer.
        if (interestAmount !== '') payload.interestAmount = Number(interestAmount);
        if (paidAmount !== '') payload.paidAmount = Number(paidAmount);
        if (principalOutstandingAtCharge !== '') payload.principalOutstandingAtCharge = Number(principalOutstandingAtCharge);
        if (interestRateAtCharge !== '') payload.interestRateAtCharge = Number(interestRateAtCharge);
        if (remarks.trim()) payload.remarks = remarks.trim();
        await interestApi.createRecord(payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the interest record.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Period</Text>
        <View style={styles.row}>
          <TextInput
            label="Month (1-12) *"
            value={month}
            onChangeText={setMonth}
            mode="outlined"
            keyboardType="number-pad"
            style={[styles.input, styles.rowInput]}
          />
          <TextInput
            label="Year *"
            value={year}
            onChangeText={setYear}
            mode="outlined"
            keyboardType="number-pad"
            style={[styles.input, styles.rowInput]}
          />
        </View>
        <TextInput label="Due Date (YYYY-MM-DD) *" value={dueDate} onChangeText={setDueDate} mode="outlined" style={styles.input} />

        <Text style={styles.sectionLabel}>Amounts</Text>
        <TextInput
          label="Interest Amount (₹)"
          value={interestAmount}
          onChangeText={setInterestAmount}
          mode="outlined"
          keyboardType="numeric"
          placeholder={isEdit ? undefined : 'Auto-calculated from outstanding principal if left blank'}
          style={styles.input}
        />
        <TextInput label="Paid Amount (₹)" value={paidAmount} onChangeText={setPaidAmount} mode="outlined" keyboardType="numeric" style={styles.input} />

        <Text style={styles.sectionLabel}>At Time of Charge (optional)</Text>
        <TextInput
          label="Principal Outstanding"
          value={principalOutstandingAtCharge}
          onChangeText={setPrincipalOutstandingAtCharge}
          mode="outlined"
          keyboardType="numeric"
          placeholder="Auto-filled from the loan if left blank"
          style={styles.input}
        />
        <TextInput
          label="Interest Rate (%)"
          value={interestRateAtCharge}
          onChangeText={setInterestRateAtCharge}
          mode="outlined"
          keyboardType="decimal-pad"
          placeholder="Defaults to the loan's current rate"
          style={styles.input}
        />

        <TextInput label="Remarks" value={remarks} onChangeText={setRemarks} mode="outlined" multiline numberOfLines={2} style={styles.input} />

        <HelperText type="error" visible={!!error}>{error}</HelperText>

        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.submitButton}>
          {isEdit ? 'Save Changes' : 'Add Record'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 110 },
  sectionLabel: { ...typography.h3, fontSize: 15, color: colors.indigo, marginTop: spacing.sm, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  rowInput: { flex: 1 },
  input: { marginBottom: spacing.md, backgroundColor: colors.surface },
  submitButton: { marginTop: spacing.sm, paddingVertical: 4 },
});
