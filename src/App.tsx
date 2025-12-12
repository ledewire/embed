import { useState, useEffect } from "preact/hooks";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Overlay } from "./components/Overlay";
import { LoginModal } from "./components/LoginModal";
import { SignupModal } from "./components/SignupModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { AddFundsModal } from "./components/AddFundsModal";
import { AlreadyPurchasedModal } from "./components/AlreadyPurchasedModal";
import { AuthService } from "./services/authService";
import { PurchaseService } from "./services/purchaseService";
import { ConfigProvider, useConfig } from "./contexts/ConfigContext";
import "./style.css";
import ResetPassword from "./components/ResetPassword";

interface AppProps {
  config: {
    apiKey?: string;
    contentId?: string;
    creatorId?: string;
    playerType?: string;
    autoplay?: boolean;
  };
  onUnlock?: () => void;
}

type ModalState =
  | "overlay"
  | "login"
  | "signup"
  | "confirm"
  | "addFunds"
  | "alreadyPurchased"
  | "unlocked"
  | "resetPassword";

export function App({ config, onUnlock }: AppProps) {
  return (
    <ConfigProvider apiKey={config.apiKey || ""}>
      <AppContent config={config} onUnlock={onUnlock} />
    </ConfigProvider>
  );
}

const AppContent = ({ config, onUnlock }: AppProps) => {
  const { googleClientId, isLoading } = useConfig();
  const [modalState, setModalState] = useState<ModalState>("overlay");
  const [userBalance, setUserBalance] = useState("0.00");
  const [contentPrice, setContentPrice] = useState(0);

  // Helper to unlock content
  const unlockContent = (delay = 100) => {
    setModalState("unlocked");
    if (onUnlock) {
      setTimeout(() => onUnlock(), delay);
    }
  };

  // Helper to fetch and update balance
  const updateBalance = async () => {
    try {
      const balanceData = await PurchaseService.getWalletBalance();
      setUserBalance((balanceData.balance_cents / 100).toFixed(2));
    } catch (error) {
      // Silent fail - balance stays at default
    }
  };

  // Helper to check if content is already purchased
  const checkAlreadyPurchased = async (): Promise<boolean> => {
    if (!config.contentId) return false;

    try {
      const { has_purchased } = await PurchaseService.verifyPurchase(
        config.contentId
      );
      return has_purchased;
    } catch (error) {
      return false;
    }
  };

  // Check authentication and purchase status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await AuthService.ensureAuthenticated();
        if (!isAuth) return;

        // Check if already purchased
        if (await checkAlreadyPurchased()) {
          unlockContent();
          return;
        }

        // Fetch wallet balance
        await updateBalance();
      } catch (error) {
        // Silent fail - user will login if needed
      }
    };

    const getPrice = async () => {
      const price = await AuthService.getDynamicPricing(config.contentId || "");

      //conversion to dollar as we are getting price in cents
      setContentPrice(price.price_cents);
    };
    getPrice();
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (await checkAlreadyPurchased()) {
      setModalState("alreadyPurchased");
      setTimeout(() => unlockContent(), 2000);
      return;
    }

    await updateBalance();
    setModalState("confirm");
  };

  const handleSignupSuccess = async () => {
    try {
      // Check if already purchased
      const alreadyPurchased = await checkAlreadyPurchased();

      if (alreadyPurchased) {
        setModalState("alreadyPurchased");
        setTimeout(() => unlockContent(), 2000);
        return;
      }

      // Fetch balance and show confirm modal
      await updateBalance();
      setModalState("confirm");
    } catch (error) {
      // Fallback to confirm modal even if there's an error
      setModalState("confirm");
    }
  };

  const handleCloseModal = () => {
    setModalState("overlay");
  };

  const handleAddFunds = () => {
    setModalState("addFunds");
  };

  const handleAddFundsSuccess = async () => {
    await updateBalance();
    setModalState("confirm");
  };

  const handleConfirmPurchase = async () => {
    if (!config.contentId) {
      throw new Error("Content ID is required for purchase");
    }

    const priceCents = Math.round(+contentPrice);

    try {
      await PurchaseService.purchaseContent(config.contentId, priceCents);
      await updateBalance();
      unlockContent();
    } catch (error: any) {
      // Handle "already purchased" error
      if (error.message?.toLowerCase().includes("already purchased")) {
        setModalState("alreadyPurchased");
        setTimeout(() => unlockContent(), 2000);
      } else {
        throw error;
      }
    }
  };

  const handleResetClick = () => {
    setModalState("resetPassword");
  };

  const backToLogin = () => {
    setModalState("login");
  };

  if (modalState === "unlocked") return null;

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

  // Use googleClientId if available, otherwise use a fallback
  // Google OAuth will only work if a valid client ID is configured
  const clientId =
    googleClientId ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "placeholder-client-id";

  const appContent = (
    <div className="ledewire-wrapper font-sans antialiased">
      {modalState === "overlay" && (
        <Overlay
          price={contentPrice.toString() || "0.00"}
          onPurchase={handlePurchaseClick}
        />
      )}

      {modalState === "login" && (
        <LoginModal
          onClose={handleCloseModal}
          onResetClick={handleResetClick}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setModalState("signup")}
        />
      )}

      {modalState === "signup" && (
        <SignupModal
          onClose={handleCloseModal}
          onSignupSuccess={handleSignupSuccess}
          onSwitchToLogin={() => setModalState("login")}
        />
      )}

      {modalState === "confirm" && (
        <ConfirmModal
          onClose={handleCloseModal}
          onConfirm={handleConfirmPurchase}
          onAddFunds={handleAddFunds}
          balance={userBalance}
          price={contentPrice.toString() || "0.00"}
        />
      )}

      {modalState === "addFunds" && (
        <AddFundsModal
          onClose={() => setModalState("confirm")}
          onSuccess={handleAddFundsSuccess}
          requiredAmount={contentPrice.toString() || "0.00"}
          currentBalance={userBalance}
        />
      )}

      {modalState === "resetPassword" && (
        <>
          <ResetPassword backToLogin={backToLogin} />
        </>
      )}

      {modalState === "alreadyPurchased" && <AlreadyPurchasedModal />}
    </div>
  );

  return (
    <GoogleOAuthProvider clientId={clientId}>{appContent}</GoogleOAuthProvider>
  );
};
