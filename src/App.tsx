import { h } from "preact";
import { useState } from "preact/hooks";
import { Overlay } from "./components/Overlay";
import { LoginModal } from "./components/LoginModal";
import "./style.css"; // Import so Vite processes it, but we'll inject manually in main.tsx

interface AppProps {
  config: {
    price: string;
    contentId?: string;
    creatorId?: string;
    playerType?: string;
    autoplay?: boolean;
  };
}

import { GoogleOAuthProvider } from "@react-oauth/google";

export function App({ config }: AppProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const handlePurchaseClick = () => {
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  if (!isLocked) return null;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    console.warn(
      "WARNING: VITE_GOOGLE_CLIENT_ID is not set. Google login will not work."
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="ledewire-wrapper font-sans antialiased">
        {!showLogin ? (
          <Overlay
            price={config.price || "0.00"}
            onPurchase={handlePurchaseClick}
          />
        ) : (
          <LoginModal onClose={handleCloseLogin} />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
