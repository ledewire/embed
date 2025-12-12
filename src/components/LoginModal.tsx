import { useState } from "preact/hooks";
import { GoogleLogin } from "@react-oauth/google";
import { AuthService } from "../services/authService";

interface LoginModalProps {
  onClose?: () => void;
  onLoginSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onResetClick?: () => void;
}

export function LoginModal({
  onClose,
  onLoginSuccess,
  onSwitchToSignup,
  onResetClick,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.loginWithGoogle(credentialResponse.credential);

      if (onLoginSuccess) {
        setTimeout(() => onLoginSuccess(), 300);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Google login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  // Email/Password login
  const handleEmailLogin = async (e: Event) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthService.loginWithEmail(email, password);

      if (onLoginSuccess) {
        setTimeout(() => onLoginSuccess(), 300);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
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
          maxHeight: "min(80vh, calc(100vh - 40px))",
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

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "20px",
              color: "#991B1B",
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            size="large"
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
          />
        </div>

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
        <form onSubmit={handleEmailLogin}>
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
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              placeholder="your.email@example.com"
              disabled={isLoading}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "15px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
                opacity: isLoading ? 0.6 : 1,
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
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              disabled={isLoading}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "15px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
                opacity: isLoading ? 0.6 : 1,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4A7C9C")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              background: isLoading ? "#9CA3AF" : "#4A7C9C",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginBottom: "20px",
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading) e.currentTarget.style.background = "#3D6883";
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.currentTarget.style.background = "#4A7C9C";
            }}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <a
              href="#"
              style={{
                fontSize: "14px",
                color: "#4A7C9C",
                textDecoration: "none",
              }}
              onClick={(e) => {
                if (!onResetClick) return;
                onResetClick();
              }}
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
              onClick={(e) => {
                e.preventDefault();
                if (onSwitchToSignup) onSwitchToSignup();
              }}
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
