import { useGoogleLogin } from "@react-oauth/google";

interface LoginModalProps {
  onClose?: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      console.log("Login successful:", codeResponse);
      console.log("Authorization Code:", codeResponse.code);
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
      className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "20px",
          padding: "2px",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="bg-white" style={{ borderRadius: "18px" }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-xl transition-all"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "rotate(0deg) scale(1)";
            }}
          >
            ×
          </button>

          {/* Header */}
          <div className="pt-8 pb-6 px-6 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "50%",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              }}
            >
              <span style={{ filter: "brightness(0) invert(1)" }}>🔐</span>
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Welcome Back
            </h2>
            <p className="text-sm text-gray-600">
              Sign in to unlock premium content
            </p>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full px-4 py-3 rounded-xl font-semibold mb-4 transition-all duration-300 flex items-center justify-center gap-3"
              style={{
                background: "white",
                border: "2px solid #e2e8f0",
                color: "#334155",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span className="text-xl font-bold" style={{ color: "#667eea" }}>
                G
              </span>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-gray-500 text-xs font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-3">
                <label
                  className="block text-gray-700 text-xs font-semibold mb-1.5"
                  htmlFor="email"
                >
                  EMAIL ADDRESS
                </label>
                <input
                  className="border-2 border-gray-200 rounded-lg w-full py-2.5 px-3.5 text-gray-900 text-sm focus:outline-none focus:border-purple-500 transition-all"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  style={{ fontSize: "14px" }}
                />
              </div>

              <div className="mb-5">
                <label
                  className="block text-gray-700 text-xs font-semibold mb-1.5"
                  htmlFor="password"
                >
                  PASSWORD
                </label>
                <input
                  className="border-2 border-gray-200 rounded-lg w-full py-2.5 px-3.5 text-gray-900 text-sm focus:outline-none focus:border-purple-500 transition-all"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  style={{ fontSize: "14px" }}
                />
              </div>

              <button
                className="w-full py-3 px-6 rounded-xl font-semibold text-white mb-4 transition-all duration-300"
                type="submit"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(102, 126, 234, 0.5)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(102, 126, 234, 0.4)";
                }}
              >
                Sign In
              </button>

              <div className="flex justify-between items-center text-xs">
                <a
                  href="#"
                  className="font-medium transition-colors"
                  style={{ color: "#667eea" }}
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
                <a
                  href="#"
                  className="font-medium transition-colors"
                  style={{ color: "#667eea" }}
                  onClick={(e) => e.preventDefault()}
                >
                  Create account
                </a>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-3 border-t border-gray-100 text-center"
            style={{ borderRadius: "0 0 18px 18px", background: "#f9fafb" }}
          >
            <p className="text-xs text-gray-500">
              Secured by{" "}
              <span className="font-bold" style={{ color: "#667eea" }}>
                LedeWire
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
