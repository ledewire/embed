import { useGoogleLogin } from "@react-oauth/google";

interface LoginModalProps {
  onClose?: () => void;
  onLoginSuccess?: () => void;
}

export function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      console.log("Login successful:", codeResponse);
      console.log("Authorization Code:", codeResponse.code);
      // Trigger the confirm modal
      if (onLoginSuccess) {
        setTimeout(() => onLoginSuccess(), 500);
      }
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      alert("Google login failed. Please try again.");
    },
    onNonOAuthError: (error) => {
      console.error("Non-OAuth Error:", error);
      alert("An error occurred during login.");
    },
    flow: "auth-code",
  });

  const handleGoogleLogin = () => {
    console.log("Google login button clicked");
    try {
      login();
    } catch (error) {
      console.error("Error calling login:", error);
      alert("Failed to initiate Google login.");
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
          maxHeight: "min(85vh, calc(100vh - 40px))",
          overflowY: "auto",
          padding: "clamp(20px, 5vw, 40px)",
        }}
        className="custom-scrollbar"
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
            fontSize: "28px",
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: "8px",
            textAlign: "left",
            marginTop: 0,
          }}
        >
          Welcome back!
        </h2>
        <p
          style={{
            fontSize: "15px",
            color: "#6B7280",
            marginBottom: "32px",
            lineHeight: "1.5",
            textAlign: "left",
          }}
        >
          Sign in to access your wallet and purchase this premium content.
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "6px",
            border: "1px solid #D1D5DB",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            fontSize: "15px",
            fontWeight: "500",
            color: "#374151",
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: "24px",
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
          <svg width="18" height="18" viewBox="0 0 18 18">
            <g fill="none" fillRule="evenodd">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                fill="#EA4335"
              />
            </g>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div
          style={{
            position: "relative",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{ width: "100%", borderTop: "1px solid #E5E7EB" }}
            ></div>
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                padding: "0 12px",
                background: "white",
                fontSize: "12px",
                color: "#9CA3AF",
                fontWeight: "500",
                letterSpacing: "0.5px",
              }}
            >
              OR CONTINUE WITH EMAIL
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "6px",
                textAlign: "left",
              }}
            >
              EMAIL *
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "15px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7C9C")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "6px",
                textAlign: "left",
              }}
            >
              PASSWORD *
            </label>
            <input
              type="password"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "15px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7C9C")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              console.log("Demo login - proceeding to confirm modal");
              if (onLoginSuccess) {
                onLoginSuccess();
              }
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              background: "#4A7C9C",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: "20px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#3D6883")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#4A7C9C")}
          >
            Log In
          </button>

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <a
              href="#"
              style={{
                fontSize: "14px",
                color: "#4A7C9C",
                textDecoration: "none",
              }}
              onClick={(e) => e.preventDefault()}
              onMouseOver={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              Forgot Password?
            </a>
          </div>

          <div
            style={{ textAlign: "center", fontSize: "14px", color: "#6B7280" }}
          >
            Need an account?{" "}
            <a
              href="#"
              style={{
                color: "#4A7C9C",
                textDecoration: "none",
                fontWeight: "500",
              }}
              onClick={(e) => e.preventDefault()}
              onMouseOver={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              Sign up
            </a>
          </div>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
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
