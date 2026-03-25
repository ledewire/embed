import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { AddFundsModal } from "./AddFundsModal";
import { getSdkClient } from "../services/sdkClient";

vi.mock("../services/sdkClient", () => ({ getSdkClient: vi.fn() }));

const mockLw = {
  wallet: {
    createPaymentSession: vi.fn(),
  },
};

describe("AddFundsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(getSdkClient).mockReturnValue(mockLw as any);
    (window as unknown as { Stripe?: unknown }).Stripe = vi.fn(() => ({
      elements: () => ({
        create: () => ({
          mount: vi.fn(),
          unmount: vi.fn(),
          on: vi.fn(),
        }),
      }),
      confirmCardPayment: vi.fn(),
    }));
  });

  it("renders shortfall and suggested amount", () => {
    render(<AddFundsModal requiredAmount="10.00" currentBalance="2.00" />);
    expect(screen.getByText(/You need \$8\.00 more/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggested: \$13\.00/i)).toBeInTheDocument();
  });

  it("shows validation for invalid amount", async () => {
    render(<AddFundsModal requiredAmount="10.00" currentBalance="2.00" />);
    fireEvent.input(screen.getByRole("spinbutton"), { target: { value: "0" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Payment" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid amount (minimum $1)"),
      ).toBeInTheDocument();
    });
    expect(mockLw.wallet.createPaymentSession).not.toHaveBeenCalled();
  });

  it("creates a payment session for valid amount", async () => {
    mockLw.wallet.createPaymentSession.mockResolvedValue({
      client_secret: "cs_test",
      session_id: "sess_123",
      public_key: "pk_test",
    });

    render(<AddFundsModal requiredAmount="10.00" currentBalance="2.00" />);
    fireEvent.input(screen.getByRole("spinbutton"), {
      target: { value: "12.50" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Payment" }),
    );

    await waitFor(() => {
      expect(mockLw.wallet.createPaymentSession).toHaveBeenCalledWith({
        amount_cents: 1250,
        currency: "usd",
      });
    });
    expect(screen.getByText("Secure payment processing")).toBeInTheDocument();
    expect(screen.getByText("Add $12.50 to Wallet")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <AddFundsModal
        onClose={onClose}
        requiredAmount="10.00"
        currentBalance="2.00"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
