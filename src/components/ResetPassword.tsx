import { useState } from "preact/hooks";
import { AuthService } from "../services/authService";
import { AxiosError } from "axios";

interface LoginModalProps {
  onClose?: () => void;
  backToLogin?: () => void;
}

const ResetPassword = ({ onClose, backToLogin }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [otpError, setOtpError] = useState({
    otp: "",
    newPassword: "",
  });
  const [error, setError] = useState("");

  // Validation helpers
  const validateOtp = (value: string) => {
    if (!/^\d{6}$/.test(value)) {
      return "OTP must be exactly 6 numeric digits.";
    }
    return "";
  };

  const validatePassword = (value: string) => {
    if (value.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  };

  // submit for sending reset code
  const handleSendResetCode = async (e: any) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await AuthService.getResetCode(email);
      setIsOtpSent(true);
      setIsLoading(false);
      setError("");
    } catch (error) {
      setIsLoading(false);
      const err = error as AxiosError<{ error: { message: string } }>;
      setError(err?.response?.data?.error?.message || "Something went wrong");
    }
  };

  // submit for setting new password
  const handleSetNewPassword = async (e: any) => {
    e.preventDefault();

    const otpValidationMsg = validateOtp(otp);
    const pwValidationMsg = validatePassword(newPassword);
    setOtpError({ otp: otpValidationMsg, newPassword: pwValidationMsg });
    if (otpValidationMsg || pwValidationMsg) {
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.setNewPassword({ email, newPassword, otp });
      setIsLoading(false);
      setError("");
      if (onClose) onClose();
    } catch (error) {
      setIsLoading(false);
      const err = error as AxiosError<{ error: { message: string } }>;
      setError(
        err?.response?.data?.error?.message || "Failed to reset password"
      );
    }
  };

  // restrict otp input to digits only as user types
  const handleOtpChange = (e: any) => {
    const raw = e?.currentTarget?.value || "";
    const digits = raw.replace(/\D/g, "").slice(0, 6); // only digits, max 6
    setOtp(digits);
    if (otpError.otp) {
      setOtpError((prev) => ({ ...prev, otp: validateOtp(digits) }));
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
          maxWidth: "min(350px, calc(100vw - 40px))",
          maxHeight: "min(80vh, calc(100vh - 40px))",
          overflowY: "auto",
          padding: "clamp(20px, 5vw, 40px)",
        }}
        className="custom-scrollbar"
      >
        {!isOtpSent ? (
          <div style={{ padding: "20px 0px" }}>
            <div style={{ width: "100%", border: "1px solid gray" }}>
              <h5 style={{ margin: "10px 10px" }}>Reset your password</h5>
              <p style={{ fontSize: "12px", margin: "10px 10px" }}>
                Enter your email address and we'll send you a secure reset code.
                Check your inbox for the code.
              </p>
            </div>

            <form onSubmit={handleSendResetCode}>
              <div style={{ margin: "20px 0px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgb(55, 65, 81)",
                    marginBottom: 6,
                    textAlign: "left",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  onChange={(e: any) => {
                    setEmail(e?.currentTarget?.value);
                  }}
                  value={email}
                  placeholder={"abc@gmail.com"}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 15,
                    border: "1px solid rgb(209, 213, 219)",
                    borderRadius: 6,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    opacity: 1,
                  }}
                />

                <p style={{ fontSize: 12, color: "red" }}>{error}</p>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type={"submit"}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    padding: "16px 32px",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 16,
                    color: "white",
                    background: isLoading ? "#acbfcb" : "rgb(74, 124, 156)",
                    border: "none",
                    cursor: "pointer",
                    transition: "0.2s",
                    boxShadow: "rgba(74, 124, 156, 0.3) 0px 2px 8px",
                  }}
                >
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </button>
              </div>
            </form>
            <p
              style={{
                fontSize: 14,
                textAlign: "center",
                color: "rgb(74, 124, 156)",
                cursor: "default",
              }}
              onClick={() => {
                if (!backToLogin) return;
                backToLogin();
              }}
            >
              Back to login
            </p>
          </div>
        ) : (
          <div style={{ padding: "20px 0px" }}>
            <div
              style={{
                backgroundColor: "#f0fdf4",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#bbf7d0",
                color: "#15803d",
                paddingLeft: "1rem",
                paddingRight: "1rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                borderRadius: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <h4 style={{ color: "black", margin: 0 }}>
                Enter your reset code
              </h4>
              <p style={{ margin: "6px 0 0 0", fontSize: 13 }}>
                Check your email for the 6-digit reset code and enter it below
                along with your new password.
              </p>
            </div>

            <h3
              style={{
                color: "rgb(17 24 39 / var(--tw-text-opacity, 1))",
                fontWeight: 600,
                marginTop: 0,
              }}
            >
              Reset Password
            </h3>

            <p
              style={{
                backgroundColor: "#f0fdf4",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#bbf7d0",
                color: "#15803d",
                paddingLeft: "1rem",
                paddingRight: "1rem",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem",
                borderRadius: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              Enter the 6-digit code sent to your email and your new password.
            </p>

            <form onSubmit={handleSetNewPassword}>
              <div style={{ margin: "20px 0px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgb(55, 65, 81)",
                    marginBottom: 6,
                    textAlign: "left",
                  }}
                >
                  OTP <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  required
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 15,
                    border: "1px solid rgb(209, 213, 219)",
                    borderRadius: 6,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    opacity: 1,
                  }}
                />
                {otpError.otp && (
                  <p style={{ fontSize: 12, color: "red", marginTop: 6 }}>
                    {otpError.otp}
                  </p>
                )}
              </div>

              <div style={{ margin: "20px 0px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgb(55, 65, 81)",
                    marginBottom: 6,
                    textAlign: "left",
                  }}
                >
                  New Password <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e: any) => {
                    setNewPassword(e?.currentTarget?.value);
                    if (otpError.newPassword) {
                      setOtpError((prev) => ({
                        ...prev,
                        newPassword: validatePassword(e?.currentTarget?.value),
                      }));
                    }
                  }}
                  placeholder="At least 6 characters"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 15,
                    border: "1px solid rgb(209, 213, 219)",
                    borderRadius: 6,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    opacity: 1,
                  }}
                />
                {otpError.newPassword && (
                  <p style={{ fontSize: 12, color: "red", marginTop: 6 }}>
                    {otpError.newPassword}
                  </p>
                )}
              </div>
              <p style={{ fontSize: 12, color: "red" }}>{error}</p>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    padding: "16px 32px",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 16,
                    color: "white",
                    background: isLoading ? "#acbfcb" : "rgb(74, 124, 156)",
                    border: "none",
                    cursor: "pointer",
                    transition: "0.2s",
                    boxShadow: "rgba(74, 124, 156, 0.3) 0px 2px 8px",
                  }}
                >
                  {isLoading ? "Loading..." : "Set New Password"}
                </button>
              </div>
            </form>

            <p
              style={{
                fontSize: 14,
                textAlign: "center",
                color: "rgb(74, 124, 156)",
                cursor: "default",
              }}
              onClick={() => {
                if (!backToLogin) return;
                backToLogin();
              }}
            >
              Back to login
            </p>
          </div>
        )}

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
};

export default ResetPassword;
