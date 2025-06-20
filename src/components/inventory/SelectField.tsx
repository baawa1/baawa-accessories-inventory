import React from 'react'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select'
import { Input } from '../ui/input'

interface Option {
  id: string
  name: string
}

interface SelectFieldProps {
  name: string
  label: string
  control: any
  options: Option[]
  placeholder: string
  disabled?: boolean
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  control,
  options,
  placeholder,
  disabled = false,
}) => (
  <FormField
    name={name}
    control={control}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Select
            value={field.value ? String(field.value) : undefined}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.id} value={String(opt.id)}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)

interface NumberFieldProps {
  name: string
  label: string
  control: any
  placeholder?: string
  step?: string | number
  min?: number
  disabled?: boolean
}

export const NumberField: React.FC<NumberFieldProps> = ({
  name,
  label,
  control,
  placeholder = '',
  step = '0.01',
  min = 0,
  disabled = false,
}) => (
  <FormField
    name={name}
    control={control}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            type='number'
            step={step}
            min={min}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)
