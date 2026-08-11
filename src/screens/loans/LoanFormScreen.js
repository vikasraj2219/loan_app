import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { loanApi } from '../../api/loanApi';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency, formatDate } from '../../utils/format';
import StepProgress from '../../components/StepProgress';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CREATE_STEPS = ['Borrower', 'Loan Details', 'Review'];

export default function LoanFormScreen({ route, navigation }) {
  const editId = route.params?.id;
  const isEdit = !!editId;

  const [step, setStep] = useState(0);
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

  useEffect(() => {
    if (route.params?.selectedBorrowerId) {
      setBorrowerId(route.params.selectedBorrowerId);
      setBorrowerName(route.params.selectedBorrowerName);
      if (!isEdit) setStep((s) => Math.max(s, 1));
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

  const validateDetails = () => {
    if (!isEdit && (!loanAmount || Number(loanAmount) <= 0)) return 'Loan amount must be greater than 0.';
    if (interestRate === '' || Number(interestRate) < 0) return 'Interest rate must be 0 or greater.';
    if (loanDate && !ISO_DATE_RE.test(loanDate)) return 'Loan date must be in YYYY-MM-DD format.';
    if (dueDate && !ISO_DATE_RE.test(dueDate)) return 'Due date must be in YYYY-MM-DD format.';
    if (tenureMonths && Number(tenureMonths) < 1) return 'Tenure must be at least 1 month.';
    return '';
  };

  const handleDetailsNext = () => {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
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
        const payload = { borrower: borrowerId, loanAmount: Number(loanAmount), interestRate: Number(interestRate) };
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
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  // --- Edit mode: simple single-screen form (no wizard needed for a few fields) ---
  if (isEdit) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.readonlyCard}>
            <Text style={styles.readonlyText}>{borrowerName}</Text>
            <Text style={styles.readonlyHint}>Borrower cannot be changed after a loan is created.</Text>
          </View>
          <View style={styles.readonlyCard}>
            <Text style={styles.readonlyText}>Principal: {formatCurrency(Number(loanAmount))}</Text>
            <Text style={styles.readonlyHint}>Loan amount only changes through recorded payments.</Text>
          </View>
          <TextInput label="Monthly Interest Rate (%) *" value={interestRate} onChangeText={setInterestRate} mode="outlined" keyboardType="decimal-pad" style={styles.input} />
          <TextInput label="Tenure (months)" value={tenureMonths} onChangeText={setTenureMonths} mode="outlined" keyboardType="number-pad" style={styles.input} />
          <TextInput label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} mode="outlined" style={styles.input} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" multiline numberOfLines={3} style={styles.input} />
          <HelperText type="error" visible={!!error}>{error}</HelperText>
          <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.submitButton}>
            Save Changes
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- Create mode: 3-step wizard ---
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.progressWrap}>
        <StepProgress steps={CREATE_STEPS} activeIndex={step} />
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Who is this loan for?</Text>
            <Button
              mode="outlined"
              icon="account-search-outline"
              onPress={() => navigation.navigate('SelectBorrower', { returnTo: 'LoanForm' })}
              style={styles.selectButton}
              contentStyle={styles.selectButtonContent}
            >
              {borrowerName || 'Select a borrower'}
            </Button>
            <HelperText type="error" visible={!!error}>{error}</HelperText>
            <Button
              mode="contained"
              onPress={() => {
                if (!borrowerId) {
                  setError('Please select a borrower.');
                  return;
                }
                setError('');
                setStep(1);
              }}
              style={styles.primaryButton}
            >
              Continue
            </Button>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Loan details</Text>
            <Text style={styles.stepSubtitle}>For {borrowerName}</Text>
            <TextInput label="Loan Amount (₹) *" value={loanAmount} onChangeText={setLoanAmount} mode="outlined" keyboardType="numeric" style={styles.input} />
            <TextInput label="Monthly Interest Rate (%) *" value={interestRate} onChangeText={setInterestRate} mode="outlined" keyboardType="decimal-pad" style={styles.input} />
            <TextInput label="Loan Date (YYYY-MM-DD)" value={loanDate} onChangeText={setLoanDate} mode="outlined" placeholder="Defaults to today" style={styles.input} />
            <TextInput label="Tenure (months)" value={tenureMonths} onChangeText={setTenureMonths} mode="outlined" keyboardType="number-pad" style={styles.input} />
            <TextInput label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} mode="outlined" style={styles.input} />
            <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" multiline numberOfLines={3} style={styles.input} />
            <HelperText type="error" visible={!!error}>{error}</HelperText>
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setStep(0)} style={styles.secondaryButton}>Back</Button>
              <Button mode="contained" onPress={handleDetailsNext} style={styles.primaryButtonFlex}>Continue</Button>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Review & create</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="Borrower" value={borrowerName} />
              <ReviewRow label="Loan Amount" value={formatCurrency(Number(loanAmount) || 0)} emphasize />
              <ReviewRow label="Interest Rate" value={`${interestRate || 0}% / month`} />
              <ReviewRow label="Loan Date" value={loanDate ? formatDate(loanDate) : 'Today'} />
              {tenureMonths ? <ReviewRow label="Tenure" value={`${tenureMonths} months`} /> : null}
              {dueDate ? <ReviewRow label="Due Date" value={formatDate(dueDate)} /> : null}
              {notes ? <ReviewRow label="Notes" value={notes} /> : null}
            </View>
            <HelperText type="error" visible={!!error}>{error}</HelperText>
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setStep(1)} style={styles.secondaryButton} disabled={submitting}>Back</Button>
              <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.primaryButtonFlex}>
                Create Loan
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value, emphasize }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={[styles.reviewValue, emphasize && { color: colors.indigo, fontSize: 17 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  progressWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  stepTitle: { ...typography.h2, color: colors.ink, marginBottom: spacing.xs },
  stepSubtitle: { ...typography.body, color: colors.inkMuted, marginBottom: spacing.md },
  input: { marginBottom: spacing.md },
  selectButton: { marginBottom: spacing.md, borderColor: colors.indigo },
  selectButtonContent: { justifyContent: 'flex-start', paddingVertical: 4 },
  readonlyCard: { marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  readonlyText: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  readonlyHint: { ...typography.caption, color: colors.inkMuted, marginTop: 4 },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md, ...shadow.sm },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  reviewLabel: { ...typography.body, color: colors.inkMuted },
  reviewValue: { ...typography.body, color: colors.ink, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  secondaryButton: { flex: 1, borderColor: colors.indigo },
  primaryButton: { marginTop: spacing.sm, paddingVertical: 4 },
  primaryButtonFlex: { flex: 1 },
  submitButton: { marginTop: spacing.sm, paddingVertical: 4 },
});
