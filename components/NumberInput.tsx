import React, { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  prefix = '',
  suffix = '',
  min,
  max
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // 数値からフォーマットされた文字列に変換
    if (value === 0 || value === '') {
      setInputValue('');
    } else {
      setInputValue(value.toLocaleString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, ''); // カンマを除去

    if (rawValue === '') {
      setInputValue('');
      onChange('');
      return;
    }

    const numericValue = parseInt(rawValue) || 0;

    // min/maxチェック
    let finalValue = numericValue;
    if (min !== undefined && finalValue < min) finalValue = min;
    if (max !== undefined && finalValue > max) finalValue = max;

    setInputValue(finalValue.toLocaleString()); // フォーマットして表示
    onChange(finalValue);
  };

  const handleFocus = () => {
    // フォーカス時はカンマを除去して表示
    setInputValue(value === '' ? '' : value.toString());
  };

  const handleBlur = () => {
    // ブラー時はフォーマットして表示
    setInputValue((value === 0 || value === '') ? '' : value.toLocaleString());
  };

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted font-mono">
          {prefix}
        </span>
      )}
      <input
        type="text"
        className={`${className} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        min={min}
        max={max}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted font-mono">
          {suffix}
        </span>
      )}
    </div>
  );
};