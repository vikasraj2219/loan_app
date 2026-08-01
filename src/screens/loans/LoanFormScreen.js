import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator, Card } from 'react-native-paper';
import { loanApi } from '../../api/loanApi';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency } from '../../utils/format';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function LoanFormScreen({ route, navigation }) {
  const editId = route.params?.id;
  const isEdit = !!editId;

  const [borrowerId, setBorrowerId] = useState(route.params?.selectedBorrowerId || '');
  const [borrowerName, setBorrowerName] = useState(route.params?.selectedBorrowerName || '');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanDate, setLoanDate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Loan' : 'New Loan' });
  }, [isEdit, navigation]);

  // Picking a borrower from SelectBorrowerScreen merges these params back in.
  useEffect(() => {
    if (route.params?.selectedBorrowerId) {
      setBorrowerId(route.params.selectedBorrowerId);
      setBorrowerName(route.params.selectedBorrowerName);
    }
  }, [route.params?.selectedBorrowerId, route.params?.selectedBorrowerName]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await loanApi.getById(editId);
        const loan = data.data.loan;
        setBorrowerId(loan.borrower?._id);
        setBorrowerName(loan.borrower?.name);
        setLoanAmount(String(loan.loanAmount));
        setInterestRate(String(loan.interestRate));
        setLoanDate(loan.loanDate ? loan.loanDate.slice(0, 10) : '');
        setTenureMonths(loan.tenureMonths ? String(loan.tenureMonths) : '');
        setDueDate(loan.dueDate ? loan.dueDate.slice(0, 10) : '');
        setNotes(loan.notes || '');
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load loan.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, editId]);

  const validate = () => {
    if (!isEdit) {
      if (!borrowerId) return 'Please select a borrower.';
      if (!loanAmount || Number(loanAmount) <= 0) return 'Loan amount must be greater than 0.';
    }
    if (interestRate === '' || Number(interestRate) < 0) return 'Interest rate must be 0 or greater.';
    if (loanDate && !ISO_DATE_RE.test(loanDate)) return 'Loan date must be in YYYY-MM-DD format.';
    if (dueDate && !ISO_DATE_RE.test(dueDate)) return 'Due date must be in YYYY-MM-DD format.';
    if (tenureMonths && Number(tenureMonths) < 1) return 'Tenure must be at least 1 month.';
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
        const payload = { interestRate: Number(interestRate) };
        if (tenureMonths) payload.tenureMonths = Number(tenureMonths);
        if (dueDate) payload.dueDate = dueDate;
        if (notes) payload.notes = notes;
        await loanApi.update(editId, payload);
      } else {
        const payload = {
          borrower: borrowerId,
          loanAmount: Number(loanAmount),
          interestRate: Number(interestRate),
        };
        if (loanDate) payload.loanDate = loanDate;
        if (tenureMonths) payload.tenureMonths = Number(tenureMonths);
        if (dueDate) payload.dueDate = dueDate;
        if (notes) payload.notes = notes;
        await loanApi.create(payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save loan.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleSmall" style={styles.sectionLabel}>
          Borrower
        </Text>
        {isEdit ? (
          <Card style={styles.readonlyCard} mode="outlined">
            <Card.Content>
              <Text variant="bodyMedium" style={styles.readonlyText}>
                {borrowerName}
              </Text>
              <Text variant="bodySmall" style={styles.readonlyHint}>
                Borrower cannot be changed after a loan is created.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <Button
            mode="outlined"
            icon="account-search-outline"
            onPress={() => navigation.navigate('SelectBorrower', { returnTo: 'LoanForm' })}
            style={styles.selectButton}
            contentStyle={styles.selectButtonContent}
          >
            {borrowerName || 'Select a borrower'}
          </Button>
        )}

        <Text variant="titleSmall" style={styles.sectionLabel}>
          Loan Details
        </Text>
        {isEdit ? (
          <Card style={styles.readonlyCard} mode="outlined">
            <Card.Content>
              <Text variant="bodyMedium" style={styles.readonlyText}>
                Principal: {formatCurrency(Number(loanAmount))}
              </Text>
              <Text variant="bodySmall" style={styles.readonlyHint}>
                Loan amount only changes through recorded payments.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <TextInput
            label="Loan Amount (₹) *"
            value={loanAmount}
            onChangeText={setLoanAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
        )}
        <TextInput
          label="Monthly Interest Rate (%) *"
          value={interestRate}
          onChangeText={setInterestRate}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        {!isEdit && (
          <TextInput
            label="Loan Date (YYYY-MM-DD)"
            value={loanDate}
            onChangeText={setLoanDate}
            mode="outlined"
            placeholder="Defaults to today"
            style={styles.input}
          />
        )}
        <TextInput
          label="Tenure (months)"
          value={tenureMonths}
          onChangeText={setTenureMonths}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />
        <TextInput
          label="Due Date (YYYY-MM-DD)"
          value={dueDate}
          onChangeText={setDueDate}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.submitButton}>
          {isEdit ? 'Save Changes' : 'Create Loan'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { marginTop: 8, marginBottom: 8, color: '#4338CA', fontWeight: '700' },
  input: { marginBottom: 12 },
  selectButton: { marginBottom: 12, borderColor: '#4338CA' },
  selectButtonContent: { justifyContent: 'flex-start', paddingVertical: 4 },
  readonlyCard: { marginBottom: 12, backgroundColor: '#F5F7FA' },
  readonlyText: { fontWeight: '600' },
  readonlyHint: { color: '#6B7280', marginTop: 4 },
  submitButton: { marginTop: 8, paddingVertical: 4 },
});
