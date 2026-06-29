import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  suffix?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/** A single numeric input with a unit suffix. Caller owns parsing/conversion. */
export default function NumberField({
  value,
  onChangeText,
  suffix,
  placeholder,
  autoFocus,
}: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        maxLength={6}
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  suffix: { ...typography.h3, color: colors.textMuted, minWidth: 36 },
});
