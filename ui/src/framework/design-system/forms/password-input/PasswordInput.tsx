'use client';

import { Input, type InputProps } from '../input/Input';

export type PasswordInputProps = Omit<InputProps, 'type'>;

export function PasswordInput(props: PasswordInputProps) {
  return <Input {...props} type="password" autoComplete="current-password" />;
}
