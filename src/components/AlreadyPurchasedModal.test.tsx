import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { AlreadyPurchasedModal } from './AlreadyPurchasedModal';

describe('AlreadyPurchasedModal', () => {
  it('renders confirmation message', () => {
    render(<AlreadyPurchasedModal />);
    expect(screen.getByText('Already Purchased!')).toBeInTheDocument();
    expect(
      screen.getByText(/You have already purchased this content/i)
    ).toBeInTheDocument();
  });
});
