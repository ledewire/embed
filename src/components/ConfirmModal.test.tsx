import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('shows Ready to purchase when balance is sufficient', () => {
    render(
      <ConfirmModal
        onClose={() => {}}
        onConfirm={() => {}}
        onAddFunds={() => {}}
        balance="10.00"
        price="5.00"
      />
    );
    expect(screen.getByText('Ready to purchase!')).toBeInTheDocument();
  });

  it('shows Insufficient Funds when balance is below price', () => {
    render(
      <ConfirmModal
        onClose={() => {}}
        onConfirm={() => {}}
        onAddFunds={() => {}}
        balance="2.00"
        price="5.00"
      />
    );
    expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
    expect(screen.getByText(/You need \$3\.00 more/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        onClose={onClose}
        onConfirm={() => {}}
        onAddFunds={() => {}}
        balance="10.00"
        price="5.00"
      />
    );
    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Purchase Article is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmModal
        onClose={() => {}}
        onConfirm={onConfirm}
        onAddFunds={() => {}}
        balance="10.00"
        price="5.00"
      />
    );
    const purchaseButton = screen.getByRole('button', {
      name: 'Purchase Article',
    });
    fireEvent.click(purchaseButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows Add Funds when insufficient balance', () => {
    render(
      <ConfirmModal
        onClose={() => {}}
        onConfirm={() => {}}
        onAddFunds={() => {}}
        balance="1.00"
        price="5.00"
      />
    );
    expect(screen.getByRole('button', { name: 'Add Funds to Wallet' })).toBeInTheDocument();
  });

  it('calls onAddFunds when Add Funds is clicked', () => {
    const onAddFunds = vi.fn();
    render(
      <ConfirmModal
        onClose={() => {}}
        onConfirm={() => {}}
        onAddFunds={onAddFunds}
        balance="1.00"
        price="5.00"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Funds to Wallet' }));
    expect(onAddFunds).toHaveBeenCalledTimes(1);
  });
});
