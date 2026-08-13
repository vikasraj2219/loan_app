import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Text, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, typography, spacing } from '../theme/tokens';

const TONES = {
  coral: { fg: colors.coral, bg: colors.coralSurface },
  amber: { fg: colors.amber, bg: colors.amberSurface },
  indigo: { fg: colors.indigo, bg: colors.indigoSurface },
};

/**
 * A single, consistent look for every "are you sure?" moment in the app —
 * used for every delete/deactivate/irreversible action instead of a stock
 * react-native-paper Dialog.
 *
 * requireText: when set (e.g. "DELETE"), the confirm button stays disabled
 * until the person types that exact word — reserved for the genuinely
 * irreversible, cascading actions (e.g. deleting a whole loan).
 */
export default function ConfirmDialog({
  visible,
  onDismiss,
  icon = 'alert-circle-outline',
  tone = 'coral',
  title,
  message,
  detail,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  requireText,
  confirmText,
  onChangeConfirmText,
  singleAction = false,
}) {
  const paletteTone = TONES[tone] || TONES.coral;
  const confirmDisabled = loading || (requireText ? (confirmText || '').trim() !== requireText : false);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={loading ? undefined : onDismiss} style={styles.dialog}>
        <View style={styles.body}>
          <View style={[styles.iconCircle, { backgroundColor: paletteTone.bg }]}>
            <MaterialCommunityIcons name={icon} size={26} color={paletteTone.fg} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {detail ? (
            <View style={[styles.detailBox, { backgroundColor: paletteTone.bg }]}>
              <Text style={[styles.detailText, { color: paletteTone.fg }]}>{detail}</Text>
            </View>
          ) : null}

          {requireText ? (
            <View style={styles.confirmTextWrap}>
              <Text style={styles.confirmPrompt}>
                Type <Text style={styles.confirmKeyword}>{requireText}</Text> to confirm
              </Text>
              <TextInput
                mode="outlined"
                value={confirmText}
                onChangeText={onChangeConfirmText}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={requireText}
                dense
                style={styles.confirmInput}
              />
            </View>
          ) : null}

          <View style={styles.actions}>
            {!singleAction && (
              <Button mode="outlined" onPress={onDismiss} disabled={loading} style={styles.cancelButton} textColor={colors.inkMuted}>
                {cancelLabel}
              </Button>
            )}
            <Button
              mode="contained"
              onPress={onConfirm || onDismiss}
              loading={loading}
              disabled={confirmDisabled}
              style={[styles.confirmButton, { backgroundColor: paletteTone.fg }]}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: { borderRadius: radius.xl, backgroundColor: colors.surface },
  body: { padding: spacing.xl, alignItems: 'center' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.ink, textAlign: 'center', marginBottom: spacing.sm },
  message: { ...typography.body, color: colors.inkMuted, textAlign: 'center', lineHeight: 20 },
  detailBox: { borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.md, marginTop: spacing.md, width: '100%' },
  detailText: { ...typography.caption, fontWeight: '700', textAlign: 'center' },
  confirmTextWrap: { width: '100%', marginTop: spacing.lg },
  confirmPrompt: { ...typography.caption, color: colors.inkMuted, marginBottom: 6, textAlign: 'center' },
  confirmKeyword: { fontWeight: '800', color: colors.ink },
  confirmInput: { backgroundColor: colors.surface, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, width: '100%' },
  cancelButton: { flex: 1, borderColor: colors.border },
  confirmButton: { flex: 1 },
});
