import { useState, useEffect, useRef } from "preact/hooks";
import { createPortal } from "preact/compat";
import { PurchaseService } from "../services/purchaseService";

interface AddFundsModalProps {
  onClose?: () => void;
  onSuccess?: () => void;
  requiredAmount: string; // In dollars
  currentBalance: string; // In dollars
}

export function AddFundsModal({
  onClose,
  onSuccess,
  requiredAmount,
  currentBalance,
}: AddFundsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);

  // Inject minimal styles for modal since it renders outside Shadow DOM
  useEffect(() => {
    const styleId = "ledewire-modal-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .ledewire-modal-overlay * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Don't remove on unmount as other modals might use it
    };
  }, []);

  // Calculate minimum amount needed
  const required = parseFloat(requiredAmount);
  const balance = parseFloat(currentBalance);
  const shortfall = Math.max(0, required - balance);
  const suggestedAmount = Math.ceil(shortfall + 5); // Add $5 buffer

  const [customAmount, setCustomAmount] = useState(suggestedAmount.toString());

  // Load Stripe script
  useEffect(() => {
    if ((window as any).Stripe) {
      setStripeLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => setStripeLoaded(true);
    script.onerror = () => setError("Failed to load payment provider");
    document.head.appendChild(script);

    return () => {
      // Cleanup not needed as Stripe can be reused
    };
  }, []);

  // Initialize Stripe elements when payment session is created
  useEffect(() => {
    if (!paymentSession || !stripeLoaded || !cardElementRef.current) {
      return;
    }

    try {
      const stripeInstance = (window as any).Stripe(paymentSession.public_key);
      setStripe(stripeInstance);
      (window as any).__stripe_instance = stripeInstance; // Store globally as backup

      const elements = stripeInstance.elements();
      const card = elements.create("card", {
        style: {
          base: {
            fontSize: "16px",
            color: "#1F2937",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            "::placeholder": {
              color: "#9CA3AF",
            },
          },
          invalid: {
            color: "#DC2626",
            iconColor: "#DC2626",
          },
        },
      });

      // Mount card element
      card.mount(cardElementRef.current);

      // Store card element globally as backup
      (window as any).__card_element = card;

      // Set states immediately
      setCardElement(card);

      card.on("change", (event: any) => {
        if (event.error) {
          setError(event.error.message);
        } else {
          setError(null);
        }
      });

      card.on("ready", () => {
        setCardElement(card);
        (window as any).__card_element = card;
        setError(null); // Clear any errors when card is ready
      });

      return () => {
        try {
          card.unmount();
          delete (window as any).__card_element;
        } catch (e) {
          // Element might already be unmounted
        }
      };
    } catch (err: any) {
      console.error("Error initializing Stripe:", err);
      setError(err.message || "Failed to initialize payment form");
    }
  }, [paymentSession, stripeLoaded]);

  const handleInitiatePayment = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      setError("Please enter a valid amount (minimum $1)");
      return;
    }

    if (amount > 10000) {
      setError("Maximum amount is $10,000");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create payment session
      const amountCents = Math.round(amount * 100);
      const session = await PurchaseService.createPaymentSession(amountCents);
      setPaymentSession(session);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create payment session");
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    // Get current references instead of relying on state
    const currentStripe = stripe || (window as any).__stripe_instance;
    const currentCard = cardElement || (window as any).__card_element;

    if (!currentStripe || !currentCard || !paymentSession) {
      setError("Payment not fully initialized. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Confirm the payment with Stripe
      const result = await currentStripe.confirmCardPayment(
        paymentSession.client_secret,
        {
          payment_method: {
            card: currentCard,
          },
        }
      );

      if (result.error) {
        // Payment failed
        setError(result.error.message || "Payment failed");
        setIsLoading(false);
      } else if (result.paymentIntent?.status === "succeeded") {
        // Payment succeeded!
        // Wait a moment for backend webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Call success callback to refresh balance
        if (onSuccess) {
          await onSuccess();
        }
        // Modal will close via parent component
      } else {
        setError("Payment status: " + result.paymentIntent?.status);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Payment processing failed");
      setIsLoading(false);
    }
  };

  // Render in Light DOM (outside Shadow DOM) so Stripe can mount
  const modalContent = (
    <div
      className="ledewire-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 2147483647,
        padding: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose}></div>

      {/* Modal */}
      <div
        style={{
          position: "relative",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          width: "100%",
          maxWidth: "min(460px, calc(100vw - 40px))",
          padding: "clamp(20px, 5vw, 40px)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            color: "#9CA3AF",
            cursor: "pointer",
            fontSize: "24px",
            lineHeight: "1",
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#4B5563")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#9CA3AF")}
        >
          ×
        </button>

        {/* Header */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          Add Funds to Wallet
        </h2>

        {/* Warning Alert */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#92400E"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#78350F",
                marginBottom: "4px",
              }}
            >
              Insufficient Funds
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#92400E",
                lineHeight: "1.5",
              }}
            >
              You need ${shortfall.toFixed(2)} more to complete this purchase.
            </p>
          </div>
        </div>

        {/* Balance Info */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
              fontSize: "14px",
              color: "#6B7280",
            }}
          >
            <span>Current Balance:</span>
            <span style={{ fontWeight: "600", color: "#1F2937" }}>
              ${currentBalance}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              color: "#6B7280",
            }}
          >
            <span>Article Price:</span>
            <span style={{ fontWeight: "600", color: "#1F2937" }}>
              ${requiredAmount}
            </span>
          </div>
        </div>

        {/* Amount Input - Only show if payment not initiated */}
        {!paymentSession && (
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Amount to Add
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#6B7280",
                }}
              >
                $
              </span>
              <input
                type="number"
                min="1"
                max="10000"
                step="0.01"
                value={customAmount}
                onInput={(e) =>
                  setCustomAmount((e.target as HTMLInputElement).value)
                }
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 28px",
                  fontSize: "16px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7C9C")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
              />
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginTop: "8px",
              }}
            >
              Suggested: ${suggestedAmount.toFixed(2)} (includes buffer for
              future purchases)
            </p>
          </div>
        )}

        {/* Payment Information Notice */}
        {paymentSession && !isLoading && (
          <div
            style={{
              background: "#DBEAFE",
              border: "1px solid #93C5FD",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#1E40AF",
              lineHeight: "1.5",
            }}
          >
            <p style={{ marginBottom: "8px", fontWeight: "600" }}>
              Secure payment processing
            </p>
            <p>
              Your payment information is encrypted and secure. Choose your
              preferred payment method below.
            </p>
          </div>
        )}

        {/* Card Payment Section */}
        {paymentSession && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1F2937",
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              Add ${parseFloat(customAmount).toFixed(2)} to Wallet
            </div>

            {/* Apple Pay Notice */}
            <div
              style={{
                background: "#F3F4F6",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#6B7280",
                textAlign: "left",
              }}
            >
              Apple Pay is not available on this device. Please use a credit or
              debit card.
            </div>

            {/* Payment Method Label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "2px solid #4A7C9C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#4A7C9C",
                  }}
                ></div>
              </div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1F2937",
                }}
              >
                Credit or Debit Card
              </span>
            </div>

            {/* Stripe Card Element */}
            <div
              ref={cardElementRef}
              style={{
                padding: "12px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                marginBottom: "16px",
                minHeight: "40px",
                background: "white",
              }}
            ></div>

            {/* Test Card Info */}
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                fontSize: "12px",
                color: "#166534",
                lineHeight: "1.5",
              }}
            >
              <p style={{ fontWeight: "600", marginBottom: "4px" }}>
                💳 Test Card Numbers:
              </p>
              <p>• 4242 4242 4242 4242 (Visa - Success)</p>
              <p>• 4000 0000 0000 0002 (Declined)</p>
              <p>• Use any future date, any CVC, any ZIP</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "14px",
              color: "#991B1B",
              lineHeight: "1.5",
            }}
          >
            {error}
          </div>
        )}

        {/* Action Button */}
        {!paymentSession ? (
          <button
            onClick={handleInitiatePayment}
            disabled={isLoading || !stripeLoaded}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "6px",
              border: "none",
              background: isLoading || !stripeLoaded ? "#9CA3AF" : "#10B981",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: isLoading || !stripeLoaded ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginBottom: "12px",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading && stripeLoaded) {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading && stripeLoaded) {
                e.currentTarget.style.background = "#10B981";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {isLoading
              ? "Preparing payment..."
              : !stripeLoaded
              ? "Loading payment provider..."
              : `Continue to Payment`}
          </button>
        ) : (
          <button
            onClick={handleConfirmPayment}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "6px",
              border: "none",
              background: isLoading ? "#9CA3AF" : "#6366F1",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginBottom: "12px",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "#4F46E5";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "#6366F1";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {isLoading
              ? "Processing payment..."
              : `Pay $${parseFloat(customAmount || "0").toFixed(2)}`}
          </button>
        )}

        {/* Cancel Button */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "6px",
            border: "1px solid #D1D5DB",
            background: "white",
            color: "#6B7280",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#F9FAFB";
            e.currentTarget.style.borderColor = "#9CA3AF";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }}
        >
          Cancel
        </button>

        {/* Footer */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #E5E7EB",
            textAlign: "center",
            fontSize: "12px",
            color: "#9CA3AF",
          }}
        >
          <p style={{ marginBottom: "8px" }}>
            🔒 Secure payment powered by Stripe
          </p>
          <p>Powered by LedeWire</p>
        </div>
      </div>
    </div>
  );

  // Use portal to render in document.body (Light DOM) instead of Shadow DOM
  return createPortal(modalContent, document.body);
}
