import React, { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string; // Expected in yyyy-MM-dd format
  onChange: (value: string) => void;
}

export function DateInput({ value, onChange, className, ...props }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      try {
        const d = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(d)) {
          const formatted = format(d, 'dd/MM/yyyy');
          if (displayValue !== formatted) {
            setDisplayValue(formatted);
          }
        }
      } catch (e) {
        // ignore
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    
    // Allow deletion naturally
    if (inputVal.length < displayValue.length) {
      setDisplayValue(inputVal);
      // If we deleted down to empty, clear the parent state
      if (inputVal === '') {
        onChange('');
      }
      return;
    }
    
    // Strip all non-digits
    let val = inputVal.replace(/[^\d]/g, '');
    
    // Cap at 8 digits
    if (val.length > 8) val = val.substring(0, 8);
    
    // Re-insert slashes
    let formatted = val;
    if (val.length > 2) {
      formatted = val.substring(0, 2) + '/' + val.substring(2);
    }
    if (val.length > 4) {
      formatted = formatted.substring(0, 5) + '/' + val.substring(4);
    }
    
    setDisplayValue(formatted);

    // If we have a full date, try to parse and send to parent
    if (val.length === 8) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, 'yyyy-MM-dd'));
      }
    }
  };

  const handleBlur = () => {
    // Revert to valid value on blur if incomplete
    if (displayValue.length > 0 && displayValue.length < 10) {
      if (value) {
        const d = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(d)) {
          setDisplayValue(format(d, 'dd/MM/yyyy'));
        }
      } else {
        setDisplayValue('');
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/YYYY"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
}
