'use client';

import s from '../quiz.module.css';

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(' ');
export { cx };

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  full,
}: {
  value: T;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (v: T) => void;
  label: string;
  full?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className={cx(s.seg, full && s.segFull)}>
      {options.map(o => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          disabled={o.disabled}
          className={cx(s.segBtn, o.value === value && s.segBtnOn)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chips({
  value,
  options,
  onChange,
  label,
  large,
}: {
  value: string;
  options: Array<{ value: string; label: string; count?: number }>;
  onChange: (v: string) => void;
  label: string;
  large?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className={s.chips}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          className={cx(s.chip, large && s.chipLg, o.value === value && s.chipOn)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span className={s.chipCount}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Icon({ d, size = 18 }: { d: string[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

export const ICON_SEARCH = ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'm20 20-3.5-3.5'];
export const ICON_VOLUME = ['M11 5 6 9H3v6h3l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M19 5a10 10 0 0 1 0 14'];
export const ICON_VOLUME_OFF = ['M11 5 6 9H3v6h3l5 4V5z', 'm22 9-6 6', 'm16 9 6 6'];
export const ICON_CHEVRON = ['m6 9 6 6 6-6'];
