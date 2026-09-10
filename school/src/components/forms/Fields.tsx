import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
}

function FieldWrapper({ label, error, hint, required, htmlFor, children }: FieldWrapperProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-danger-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={fieldId}>
        <input
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          className={cn('input', error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500', className)}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
TextField.displayName = 'TextField';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={fieldId}>
        <textarea
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          className={cn('input min-h-[90px]', error && 'border-danger-500', className)}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
TextAreaField.displayName = 'TextAreaField';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, id, options, className, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={fieldId}>
        <select
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          className={cn('input', error && 'border-danger-500', className)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FieldWrapper>
    );
  },
);
SelectField.displayName = 'SelectField';
