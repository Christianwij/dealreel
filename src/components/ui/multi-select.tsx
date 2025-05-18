import * as React from 'react';
import Select from 'react-select';
import { cn } from '@/lib/utils';

interface Option {
  readonly value: string;
  readonly label: string;
}

interface MultiSelectProps {
  options: readonly Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  isDisabled = false
}: MultiSelectProps) {
  const selectedOptions = React.useMemo(() => {
    return options.filter(option => value.includes(option.value));
  }, [options, value]);

  const handleChange = (selected: unknown) => {
    const selectedValues = (selected as Option[])?.map(option => option.value) || [];
    onChange(selectedValues);
  };

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      className={cn(
        'min-w-[200px] w-full',
        className
      )}
      classNames={{
        control: () => 'bg-background !min-h-10 rounded-md border border-input hover:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2',
        placeholder: () => 'text-muted-foreground',
        input: () => 'text-sm',
        option: () => 'text-sm',
      }}
    />
  );
} 