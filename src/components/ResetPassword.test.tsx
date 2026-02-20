import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import ResetPassword from './ResetPassword';
import { AuthService } from '../services/authService';

vi.mock('../services/authService', () => ({
  AuthService: {
    getResetCode: vi.fn(),
    setNewPassword: vi.fn(),
  },
}));

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends reset code and moves to OTP step', async () => {
    vi.mocked(AuthService.getResetCode).mockResolvedValue({ message: 'ok' });

    render(<ResetPassword />);
    fireEvent.change(screen.getByPlaceholderText('abc@gmail.com'), {
      target: { value: 'user@test.com' },
      currentTarget: { value: 'user@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Code' }));

    await waitFor(() => {
      expect(AuthService.getResetCode).toHaveBeenCalledWith('user@test.com');
    });
    expect(screen.getByText('Enter your reset code')).toBeInTheDocument();
  });

  it('shows API error when reset code request fails', async () => {
    vi.mocked(AuthService.getResetCode).mockRejectedValue({
      response: { data: { error: { message: 'Email not found' } } },
    });

    render(<ResetPassword />);
    fireEvent.change(screen.getByPlaceholderText('abc@gmail.com'), {
      target: { value: 'missing@test.com' },
      currentTarget: { value: 'missing@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Code' }));

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('calls backToLogin when link clicked', () => {
    const backToLogin = vi.fn();
    render(<ResetPassword backToLogin={backToLogin} />);
    fireEvent.click(screen.getByText('Back to login'));
    expect(backToLogin).toHaveBeenCalledTimes(1);
  });

  it('validates OTP and password in second step', async () => {
    vi.mocked(AuthService.getResetCode).mockResolvedValue({ message: 'ok' });

    render(<ResetPassword />);
    fireEvent.change(screen.getByPlaceholderText('abc@gmail.com'), {
      target: { value: 'user@test.com' },
      currentTarget: { value: 'user@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Code' }));

    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('123456'), {
      target: { value: '12a3' },
      currentTarget: { value: '12a3' },
    });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
      target: { value: '123' },
      currentTarget: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set New Password' }));

    expect(
      screen.getByText('OTP must be exactly 6 numeric digits.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Password must be at least 6 characters.')
    ).toBeInTheDocument();
    expect(AuthService.setNewPassword).not.toHaveBeenCalled();
  });

  it('submits new password and calls onClose', async () => {
    vi.mocked(AuthService.getResetCode).mockResolvedValue({ message: 'ok' });
    vi.mocked(AuthService.setNewPassword).mockResolvedValue({ message: 'ok' });
    const onClose = vi.fn();

    render(<ResetPassword onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText('abc@gmail.com'), {
      target: { value: 'user@test.com' },
      currentTarget: { value: 'user@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Code' }));

    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('123456'), {
      target: { value: '123456' },
      currentTarget: { value: '123456' },
    });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
      target: { value: 'newpassword' },
      currentTarget: { value: 'newpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set New Password' }));

    await waitFor(() => {
      expect(AuthService.setNewPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        newPassword: 'newpassword',
        otp: '123456',
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
