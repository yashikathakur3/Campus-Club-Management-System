import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';
import Input from './Input';

describe('Button', () => {
  it('shows its loading state and disables interaction', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save changes</Button>);
    const button = screen.getByRole('button', { name: /save changes/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Input', () => {
  it('connects field error text using aria-describedby', () => {
    render(<Input label="Email" id="email" hint="Use your campus email" error="Enter a valid email." />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-hint email-error');
    expect(document.getElementById('email-error')).toHaveTextContent('Enter a valid email.');
  });
});
