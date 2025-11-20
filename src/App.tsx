import { useState } from "preact/hooks";
import { Overlay } from "./components/Overlay";
import { LoginModal } from "./components/LoginModal";
import { ConfirmModal } from "./components/ConfirmModal";
import "./style.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

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

  const handlePurchaseClick = () => {
    setModalState("login");
  };

  const handleLoginSuccess = () => {
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

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    console.warn(
      "WARNING: VITE_GOOGLE_CLIENT_ID is not set. Google login will not work."
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
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
