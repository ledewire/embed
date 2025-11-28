import { useState, useEffect } from "preact/hooks";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Overlay } from "./components/Overlay";
import { LoginModal } from "./components/LoginModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { AuthService } from "./services/authService";
import { PurchaseService } from "./services/purchaseService";
import "./style.css";
import { ConfigProvider, useConfig } from "./contexts/ConfigContext";

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
  return (
    <ConfigProvider>
      <AppContent config={config} onUnlock={onUnlock} />
    </ConfigProvider>
  );
}

const AppContent = ({ config, onUnlock }: AppProps) => {
  const { googleClientId, isLoading, error } = useConfig();

  const [modalState, setModalState] = useState<ModalState>("overlay");
  const [userBalance, setUserBalance] = useState("0.00");

  // Check if user is already logged in on mount and refresh token if needed
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await AuthService.ensureAuthenticated();
        if (isAuth) {
          // Fetch wallet balance if authenticated
          try {
            const balanceData = await PurchaseService.getWalletBalance();
            const balanceInDollars = (balanceData.balance_cents / 100).toFixed(
              2
            );
            setUserBalance(balanceInDollars);
          } catch (error) {
            // Failed to fetch balance, keep default
          }
        }
      } catch (error) {
        // Token refresh failed, user will need to login again
      }
    };
    checkAuth();
  }, []);

  const handlePurchaseClick = async () => {
    // Check authentication and refresh token if needed
    try {
      const isLoggedIn = await AuthService.ensureAuthenticated();

      if (isLoggedIn) {
        setModalState("confirm");
      } else {
        setModalState("login");
      }
    } catch (error) {
      setModalState("login");
    }
  };

  const handleLoginSuccess = async () => {
    // Fetch wallet balance after successful login
    try {
      const balanceData = await PurchaseService.getWalletBalance();
      const balanceInDollars = (balanceData.balance_cents / 100).toFixed(2);
      setUserBalance(balanceInDollars);
    } catch (error) {
      // Failed to fetch balance, keep default
    }
    setModalState("confirm");
  };

  const handleCloseModal = () => {
    setModalState("overlay");
  };

  const handleConfirmPurchase = async () => {
    if (!config.contentId) {
      throw new Error("Content ID is required for purchase");
    }

    // Convert price from string to cents
    const priceCents = Math.round(parseFloat(config.price || "0") * 100);

    // Call purchase API
    await PurchaseService.purchaseContent(config.contentId, priceCents);

    // Update balance after successful purchase
    try {
      const balanceData = await PurchaseService.getWalletBalance();
      const balanceInDollars = (balanceData.balance_cents / 100).toFixed(2);
      setUserBalance(balanceInDollars);
    } catch (error) {
      // Failed to fetch balance
    }

    setModalState("unlocked");

    if (onUnlock) {
      setTimeout(() => {
        onUnlock();
      }, 100);
    }
  };

  if (modalState === "unlocked") return null;
  console.log(googleClientId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load configuration</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!googleClientId) return null;
  console.log("generated id: ", googleClientId);
  console.log("our id: ", import.meta.env.VITE_GOOGLE_CLIENT_ID);

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
};
