import { useState, useEffect } from "preact/hooks";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Overlay } from "./components/Overlay";
import { LoginModal } from "./components/LoginModal";
import { SignupModal } from "./components/SignupModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { AddFundsModal } from "./components/AddFundsModal";
import { AlreadyPurchasedModal } from "./components/AlreadyPurchasedModal";
import { getSdkClient } from "./services/sdkClient";
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
  sellerConfig?: any;
  contentMetadata?: {
    id: string;
    content_type: string;
    title: string;
    price_cents: number;
    content_body?: string | null;
    teaser?: string | null;
    visibility: string;
    metadata?: Record<string, unknown>;
    access_info?: any;
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

export function App({
  config,
  sellerConfig,
  contentMetadata,
  onUnlock,
}: AppProps) {
  const [modalState, setModalState] = useState<ModalState>("overlay");
  const [userBalance, setUserBalance] = useState("0.00");
  const contentPrice = contentMetadata?.price_cents
    ? contentMetadata?.price_cents / 100
    : 1;
  const googleClientId = sellerConfig.google_client_id;

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
      const balanceData = await getSdkClient().wallet.balance();
      setUserBalance((balanceData.balance_cents / 100).toFixed(2));
    } catch (error) {
      // Silent fail - balance stays at default
    }
  };

  // Single checkout.state() call drives all state transitions.
  const getCheckoutAction = async () => {
    if (!config.contentId) return null;
    const { checkout_state } = await getSdkClient().checkout.state(
      config.contentId,
    );
    return checkout_state;
  };

  // Reset to login modal when the SDK signals that the session has expired.
  useEffect(() => {
    const handler = () => setModalState("login");
    window.addEventListener("lw:auth-expired", handler);
    return () => window.removeEventListener("lw:auth-expired", handler);
  }, []);

  // On mount: silently advance if the user is already authenticated/purchased.
  useEffect(() => {
    const checkOnMount = async () => {
      try {
        const state = await getCheckoutAction();
        if (!state) return;
        switch (state.next_required_action) {
          case "view_content":
            unlockContent();
            break;
          case "purchase":
          case "fund_wallet":
            // Pre-fetch balance so it's ready when the user clicks through.
            await updateBalance();
            break;
          // "authenticate": stay on overlay — wait for user interaction.
        }
      } catch {
        // Silent fail — user will interact when ready.
      }
    };

    checkOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePurchaseClick = async () => {
    if (!config.contentId) {
      setModalState("login");
      return;
    }
    try {
      const state = await getCheckoutAction();
      if (!state) return;
      switch (state.next_required_action) {
        case "view_content":
          return unlockContent();
        case "authenticate":
          return setModalState("login");
        case "fund_wallet":
          await updateBalance();
          return setModalState("addFunds");
        case "purchase":
          await updateBalance();
          return setModalState("confirm");
      }
    } catch {
      setModalState("login");
    }
  };

  // Shared handler for both login and signup success.
  const handlePostAuth = async () => {
    try {
      const state = await getCheckoutAction();
      if (!state) {
        await updateBalance();
        setModalState("confirm");
        return;
      }
      switch (state.next_required_action) {
        case "view_content":
          setModalState("alreadyPurchased");
          setTimeout(() => unlockContent(), 2000);
          break;
        case "fund_wallet":
          await updateBalance();
          setModalState("addFunds");
          break;
        default:
          await updateBalance();
          setModalState("confirm");
      }
    } catch {
      await updateBalance();
      setModalState("confirm");
    }
  };

  const handleLoginSuccess = handlePostAuth;
  const handleSignupSuccess = handlePostAuth;

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

    try {
      await getSdkClient().purchases.create({ content_id: config.contentId });
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
    <GoogleOAuthProvider clientId={googleClientId}>
      {appContent}
    </GoogleOAuthProvider>
  );
}
