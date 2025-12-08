export function AlreadyPurchasedModal() {
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
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "400px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "#10B981",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: "12px",
          }}
        >
          Already Purchased!
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#6B7280",
            lineHeight: "1.5",
          }}
        >
          You have already purchased this content. Unlocking video now...
        </p>
      </div>
    </div>
  );
}
