interface OverlayProps {
  price: string;
  onPurchase: () => void;
}

export function Overlay({ price, onPurchase }: OverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.97) 0%, rgba(30, 41, 59, 0.95) 100%)",
        backdropFilter: "blur(12px)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          padding: "2px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
          width: "100%",
          maxWidth: "320px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            }}
          >
            <span style={{ filter: "brightness(0) invert(1)" }}>🔒</span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "0.25rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Premium Content
          </h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginBottom: "1rem",
            }}
          >
            Unlock this video
          </p>

          {/* Price Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.625rem",
                fontWeight: "600",
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.25rem",
              }}
            >
              One-Time Payment
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: "0.25rem",
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  color: "#667eea",
                }}
              >
                ${price}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                USD
              </span>
            </div>
          </div>

          {/* Unlock Button */}
          <button
            onClick={onPurchase}
            style={{
              width: "100%",
              padding: "0.625rem 1.25rem",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "0.875rem",
              color: "white",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              marginBottom: "1rem",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(102, 126, 234, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(102, 126, 234, 0.4)";
            }}
          >
            Unlock Now
          </button>

          {/* Features */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                marginBottom: "0.375rem",
                fontSize: "0.75rem",
                color: "#374151",
              }}
            >
              <span
                style={{
                  color: "#10b981",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                ✓
              </span>
              <span>Instant access</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                marginBottom: "0.375rem",
                fontSize: "0.75rem",
                color: "#374151",
              }}
            >
              <span
                style={{
                  color: "#10b981",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                ✓
              </span>
              <span>Secure payment</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                fontSize: "0.75rem",
                color: "#374151",
              }}
            >
              <span
                style={{
                  color: "#10b981",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                ✓
              </span>
              <span>Watch anytime</span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <p style={{ fontSize: "0.625rem", color: "#9ca3af" }}>
              Powered by{" "}
              <span style={{ fontWeight: "bold", color: "#667eea" }}>
                LedeWire
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
