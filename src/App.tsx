import { useState, useEffect } from "preact/hooks";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Overlay } from "./components/Overlay";
import { LoginModal } from "./components/LoginModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { AuthService } from "./services/authService";
import "./style.css";

interface AppProps {
  config: {
    price: string;
    contentId?: string;
    creatorId?: string;
    playerType?: string;
    autoplay?: boolean;
  };
  onUnlock?: () => void;
}

type ModalState = "overlay" | "login" | "confirm" | "unlocked";

export function App({ config, onUnlock }: AppProps) {
  const [modalState, setModalState] = useState<ModalState>("overlay");
  const [userBalance] = useState("3.00"); // Mock balance, will come from backend
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const isLoggedIn = AuthService.isAuthenticated();
    setIsAuthenticated(isLoggedIn);
  }, []);

  const handlePurchaseClick = () => {
    // Skip login modal if user is already authenticated
    if (isAuthenticated) {
      setModalState("confirm");
    } else {
      setModalState("login");
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setModalState("confirm");
  };

  const handleCloseModal = () => {
    setModalState("overlay");
  };

  const handleConfirmPurchase = () => {
    // TODO: Call backend API to process payment
    setModalState("unlocked");

    if (onUnlock) {
      setTimeout(() => {
        onUnlock();
      }, 100);
    }
  };

  if (modalState === "unlocked") return null;

  // Google Client ID (can be updated when Google login is implemented)
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="ledewire-wrapper font-sans antialiased">
        {modalState === "overlay" && (
          <Overlay
            price={config.price || "0.00"}
            onPurchase={handlePurchaseClick}
          />
        )}

        {modalState === "login" && (
          <LoginModal
            onClose={handleCloseModal}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {modalState === "confirm" && (
          <ConfirmModal
            onClose={handleCloseModal}
            onConfirm={handleConfirmPurchase}
            balance={userBalance}
            price={config.price || "0.00"}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
