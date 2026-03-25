import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { LoginModal } from "./LoginModal";
import { getSdkClient } from "../services/sdkClient";

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (value: { credential: string }) => void;
    onError: () => void;
  }) => (
    <div>
      <button onClick={() => onSuccess({ credential: "google-token" })}>
        Google Success
      </button>
      <button onClick={onError}>Google Error</button>
    </div>
  ),
}));

vi.mock("../services/sdkClient", () => ({ getSdkClient: vi.fn() }));

const mockLw = {
  auth: {
    loginWithEmail: vi.fn(),
    loginWithGoogle: vi.fn(),
  },
};

describe("LoginModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(getSdkClient).mockReturnValue(mockLw as any);
  });

  it("renders login UI", () => {
    render(<LoginModal />);
    expect(screen.getByText("Welcome back!")).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in to access your wallet and purchase/i),
    ).toBeInTheDocument();
  });

  it("shows validation error when fields are missing", () => {
    const { container } = render(<LoginModal />);
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(
      screen.getByText("Please enter both email and password"),
    ).toBeInTheDocument();
  });

  it("submits email login and calls success callback", async () => {
    vi.useFakeTimers();
    mockLw.auth.loginWithEmail.mockResolvedValue({
      access_token: "a",
      refresh_token: "r",
      expires_at: new Date(Date.now() + 60000).toISOString(),
    });
    const onLoginSuccess = vi.fn();

    render(<LoginModal onLoginSuccess={onLoginSuccess} />);
    const passwordInput = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    fireEvent.input(screen.getByPlaceholderText("your.email@example.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.input(passwordInput, { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(mockLw.auth.loginWithEmail).toHaveBeenCalledWith({
        email: "user@test.com",
        password: "password123",
      });
    });
    await vi.advanceTimersByTimeAsync(300);
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows auth error when login fails", async () => {
    mockLw.auth.loginWithEmail.mockRejectedValue(
      new Error("Invalid email or password"),
    );

    render(<LoginModal />);
    const passwordInput = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    fireEvent.input(screen.getByPlaceholderText("your.email@example.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.input(passwordInput, { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("triggers reset and switch callbacks", () => {
    const onResetClick = vi.fn();
    const onSwitchToSignup = vi.fn();

    render(
      <LoginModal
        onResetClick={onResetClick}
        onSwitchToSignup={onSwitchToSignup}
      />,
    );
    fireEvent.click(screen.getByText("Forgot Password?"));
    fireEvent.click(screen.getByText("Sign up"));

    expect(onResetClick).toHaveBeenCalledTimes(1);
    expect(onSwitchToSignup).toHaveBeenCalledTimes(1);
  });

  it("shows Google error message", async () => {
    render(<LoginModal />);
    fireEvent.click(screen.getByText("Google Error"));
    expect(
      screen.getByText("Google login failed. Please try again."),
    ).toBeInTheDocument();
  });
});
