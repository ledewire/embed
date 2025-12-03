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
        background: "rgba(0, 0, 0, 0.5)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        zIndex: 2147483647,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          width: "100%",
          maxWidth: "min(540px, calc(100vw - 40px))",
          padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 40px)",
          textAlign: "center",
          position: "fixed",
        }}
      >
        {/* Premium Story Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            border: "1px solid #FDE68A",
            borderRadius: "20px",
            padding: "6px 16px",
            marginBottom: "24px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#4a7a93",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Premium Story</span>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: "12px",
            lineHeight: "1.2",
          }}
        >
          Access the full story
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "16px",
            color: "#6B7280",
            marginBottom: "32px",
            lineHeight: "1.5",
          }}
        >
          Unlock access and support independent voices
        </p>

        {/* Purchase Button */}
        <button
          onClick={onPurchase}
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "16px 32px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
            color: "white",
            background: "#4A7C9C",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "40px",
            boxShadow: "0 2px 8px rgba(74, 124, 156, 0.3)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#3D6883";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(74, 124, 156, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#4A7C9C";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 2px 8px rgba(74, 124, 156, 0.3)";
          }}
        >
          Purchase Now · ${price}
        </button>

        {/* Features */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "48px",
            paddingTop: "32px",
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "8px", color: "#10B981" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ margin: "0 auto" }}
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div
              style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500" }}
            >
              Instant Access
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "8px", color: "#4A7C9C" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ margin: "0 auto" }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div
              style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500" }}
            >
              Secure Payment
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "8px", color: "#6B7280" }}>
              <svg
                width="20"
                height="20"
                class="w-4 h-4 mx-auto mb-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style="color: var(--steel-blue);"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div
              style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500" }}
            >
              No Commitment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
