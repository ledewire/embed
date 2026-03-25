import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { SignupModal } from "./SignupModal";
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
    signup: vi.fn(),
    loginWithGoogle: vi.fn(),
  },
};

describe("SignupModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(getSdkClient).mockReturnValue(mockLw as any);
  });

  it("renders signup UI", () => {
    render(<SignupModal />);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("shows validation error when fields are empty", () => {
    const { container } = render(<SignupModal />);
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(screen.getByText("Please fill in all fields")).toBeInTheDocument();
  });

  it("submits signup and calls success callback", async () => {
    vi.useFakeTimers();
    mockLw.auth.signup.mockResolvedValue({
      access_token: "a",
      refresh_token: "r",
      expires_at: new Date(Date.now() + 60000).toISOString(),
    });
    const onSignupSuccess = vi.fn();

    render(<SignupModal onSignupSuccess={onSignupSuccess} />);
    const passwordInput = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.input(textboxes[0], { target: { value: "Jane" } });
    fireEvent.input(textboxes[1], { target: { value: "Doe" } });
    fireEvent.input(textboxes[2], { target: { value: "jane@test.com" } });
    fireEvent.input(passwordInput, { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(mockLw.auth.signup).toHaveBeenCalledWith({
        email: "jane@test.com",
        password: "password123",
        name: "Jane Doe",
      });
    });
    await vi.advanceTimersByTimeAsync(300);
    expect(onSignupSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows error when signup fails", async () => {
    mockLw.auth.signup.mockRejectedValue(new Error("Signup failed"));

    render(<SignupModal />);
    const passwordInput = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.input(textboxes[0], { target: { value: "Jane" } });
    fireEvent.input(textboxes[1], { target: { value: "Doe" } });
    fireEvent.input(textboxes[2], { target: { value: "jane@test.com" } });
    fireEvent.input(passwordInput, { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Signup failed")).toBeInTheDocument();
    });
  });

  it("triggers switch to login callback", () => {
    const onSwitchToLogin = vi.fn();
    render(<SignupModal onSwitchToLogin={onSwitchToLogin} />);
    fireEvent.click(screen.getByText("Log in"));
    expect(onSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it("shows Google signup error", () => {
    render(<SignupModal />);
    fireEvent.click(screen.getByText("Google Error"));
    expect(
      screen.getByText("Google signup failed. Please try again."),
    ).toBeInTheDocument();
  });
});
