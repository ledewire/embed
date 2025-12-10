import { useState } from "preact/hooks";
import { GoogleLogin } from "@react-oauth/google";
import { AuthService } from "../services/authService";

interface SignupModalProps {
  onClose?: () => void;
  onSignupSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function SignupModal({
  onClose,
  onSignupSuccess,
  onSwitchToLogin,
}: SignupModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.loginWithGoogle(credentialResponse.credential);

      if (onSignupSuccess) {
        setTimeout(() => onSignupSuccess(), 300);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Google signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google signup failed. Please try again.");
  };

  // Email/Password signup
  const handleEmailSignup = async (e: Event) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthService.signup(email, password, firstName, lastName);

      if (onSignupSuccess) {
        setTimeout(() => onSignupSuccess(), 300);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
          Create your account
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
          Sign up to get started with LedeWire and access premium content.
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

        {/* Google Signup Button */}
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
              Or continue with email
            </span>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleEmailSignup}>
          {/* First Name and Last Name Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
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
                FIRST NAME *
              </label>
              <input
                type="text"
                value={firstName}
                onInput={(e) =>
                  setFirstName((e.target as HTMLInputElement).value)
                }
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

            <div>
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
                LAST NAME *
              </label>
              <input
                type="text"
                value={lastName}
                onInput={(e) =>
                  setLastName((e.target as HTMLInputElement).value)
                }
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
          </div>

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
              background: isLoading ? "#9CA3AF" : "#2563EB",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginBottom: "20px",
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading) e.currentTarget.style.background = "#1D4ED8";
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.currentTarget.style.background = "#2563EB";
            }}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>

          <div
            style={{ textAlign: "center", fontSize: "14px", color: "#6B7280" }}
          >
            Already have an account?{" "}
            <a
              href="#"
              style={{
                color: "#4A7C9C",
                textDecoration: "none",
                fontWeight: "500",
              }}
              onClick={(e) => {
                e.preventDefault();
                if (onSwitchToLogin) onSwitchToLogin();
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              Log in
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
