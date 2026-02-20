import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { Overlay } from './Overlay';

describe('Overlay', () => {
  it('renders price in the purchase button', () => {
    render(<Overlay price="2.99" onPurchase={() => {}} />);
    expect(screen.getByRole('button', { name: /Purchase Now · \$2\.99/i })).toBeInTheDocument();
  });

  it('calls onPurchase when Purchase Now is clicked', () => {
    const onPurchase = vi.fn();
    render(<Overlay price="1.00" onPurchase={onPurchase} />);
    const button = screen.getByRole('button', { name: /Purchase Now/i });
    fireEvent.click(button);
    expect(onPurchase).toHaveBeenCalledTimes(1);
  });

  it('displays Premium Story badge', () => {
    render(<Overlay price="0.00" onPurchase={() => {}} />);
    expect(screen.getByText('Premium Story')).toBeInTheDocument();
  });

  it('displays heading and subtitle', () => {
    render(<Overlay price="0.00" onPurchase={() => {}} />);
    expect(screen.getByText('Access the full story')).toBeInTheDocument();
    expect(screen.getByText(/Unlock access and support independent voices/)).toBeInTheDocument();
  });
});
