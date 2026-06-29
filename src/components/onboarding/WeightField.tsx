import React, { useState } from 'react';

import { kgToLb, lbToKg } from '../../lib/units';
import type { UnitSystem } from '../../lib/units';
import NumberField from './NumberField';

interface Props {
  valueKg: number | null; // canonical
  unit: UnitSystem;
  onChange: (kg: number | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Weight entry. Displays lb (imperial) or kg (metric); always stores canonical kg. */
export default function WeightField({ valueKg, unit, onChange, placeholder, autoFocus }: Props) {
  const toDisplay = (kg: number | null): string => {
    if (kg == null) return '';
    return unit === 'imperial' ? String(Math.round(kgToLb(kg))) : String(Math.round(kg * 10) / 10);
  };

  // Local string keeps the keystrokes stable; canonical kg is the committed truth.
  const [text, setText] = useState<string>(toDisplay(valueKg));

  const handle = (t: string) => {
    setText(t);
    const n = parseFloat(t);
    if (Number.isNaN(n) || n <= 0) {
      onChange(null);
      return;
    }
    onChange(unit === 'imperial' ? lbToKg(n) : n);
  };

  return (
    <NumberField
      value={text}
      onChangeText={handle}
      suffix={unit === 'imperial' ? 'lb' : 'kg'}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}
