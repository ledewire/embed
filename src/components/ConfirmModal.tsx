import { useState } from "preact/hooks";

interface ConfirmModalProps {
  onClose?: () => void;
  onConfirm?: () => Promise<void>;
  balance: string;
  price: string;
}

export function ConfirmModal({
  onClose,
  onConfirm,
  balance,
  price,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlePurchase = async () => {
    if (!onConfirm) return;

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || "Failed to complete purchase. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
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

        {/* Success Alert */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "32px",
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
              Ready to purchase!
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#92400E",
                lineHeight: "1.5",
              }}
            >
              You have sufficient funds in your wallet to purchase this content.
            </p>
          </div>
        </div>

        {/* Current Balance */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "600",
              color: "#6B7280",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textAlign: "left",
            }}
          >
            Current Balance
          </label>
          <div
            style={{
              fontSize: "40px",
              fontWeight: "700",
              color: "#1F2937",
              textAlign: "left",
            }}
          >
            ${balance}
          </div>
        </div>

        {/* Article Price */}
        <div style={{ marginBottom: "32px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "600",
              color: "#6B7280",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textAlign: "left",
            }}
          >
            Article Price
          </label>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#4A7C9C",
              textAlign: "left",
            }}
          >
            ${price}
          </div>
        </div>

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
            }}
          >
            {error}
          </div>
        )}

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "6px",
            border: "none",
            background: isLoading ? "#9CA3AF" : "#4A7C9C",
            color: "white",
            fontSize: "15px",
            fontWeight: "600",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            marginBottom: "24px",
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "#3D6883";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "#4A7C9C";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {isLoading ? "Processing..." : "Purchase Article"}
        </button>

        {/* Footer */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: "1px solid #E5E7EB",
            textAlign: "center",
            fontSize: "12px",
            color: "#9CA3AF",
          }}
        >
          Powered by LedeWire
        </div>
      </div>
    </div>
  );
}
