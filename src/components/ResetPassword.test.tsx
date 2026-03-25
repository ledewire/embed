import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import ResetPassword from "./ResetPassword";
import { getSdkClient } from "../services/sdkClient";

vi.mock("../services/sdkClient", () => ({ getSdkClient: vi.fn() }));

const mockLw = {
  auth: {
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  },
};

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSdkClient).mockReturnValue(mockLw as any);
  });

  it("sends reset code and moves to OTP step", async () => {
    mockLw.auth.requestPasswordReset.mockResolvedValue({ message: "ok" });

    render(<ResetPassword />);
    fireEvent.change(screen.getByPlaceholderText("abc@gmail.com"), {
      target: { value: "user@test.com" },
      currentTarget: { value: "user@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Code" }));

    await waitFor(() => {
      expect(mockLw.auth.requestPasswordReset).toHaveBeenCalledWith({
        email: "user@test.com",
      });
    });
    expect(screen.getByText("Enter your reset code")).toBeInTheDocument();
  });

  it("shows API error when reset code request fails", async () => {
    mockLw.auth.requestPasswordReset.mockRejectedValue(
      new Error("Email not found"),
    );

    render(<ResetPassword />);
    fireEvent.change(screen.getByPlaceholderText("abc@gmail.com"), {
      target: { value: "missing@test.com" },
      currentTarget: { value: "missing@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Code" }));

    await waitFor(() => {
      expect(screen.getByText("Email not found")).toBeInTheDocument();
    });
  });

  it("calls backToLogin when link clicked", () => {
    const backToLogin = vi.fn();
    render(<ResetPassword backToLogin={backToLogin} />);
    fireEvent.click(screen.getByText("Back to login"));
    expect(backToLogin).toHaveBeenCalledTimes(1);
  });

  it("validates OTP and password in second step", async () => {
    mockLw.auth.requestPasswordReset.mockResolvedValue({ message: "ok" });

    render(<ResetPassword />);
    fireEvent.change(screen.getByPlaceholderText("abc@gmail.com"), {
      target: { value: "user@test.com" },
      currentTarget: { value: "user@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Code" }));

    await waitFor(() => {
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("123456"), {
      target: { value: "12a3" },
      currentTarget: { value: "12a3" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "123" },
      currentTarget: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set New Password" }));

    expect(
      screen.getByText("OTP must be exactly 6 numeric digits."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 6 characters."),
    ).toBeInTheDocument();
    expect(mockLw.auth.resetPassword).not.toHaveBeenCalled();
  });

  it("submits new password and calls onClose", async () => {
    mockLw.auth.requestPasswordReset.mockResolvedValue({ message: "ok" });
    mockLw.auth.resetPassword.mockResolvedValue({ message: "ok" });
    const onClose = vi.fn();

    render(<ResetPassword onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("abc@gmail.com"), {
      target: { value: "user@test.com" },
      currentTarget: { value: "user@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Code" }));

    await waitFor(() => {
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("123456"), {
      target: { value: "123456" },
      currentTarget: { value: "123456" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "newpassword" },
      currentTarget: { value: "newpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set New Password" }));

    await waitFor(() => {
      expect(mockLw.auth.resetPassword).toHaveBeenCalledWith({
        email: "user@test.com",
        reset_code: "123456",
        password: "newpassword",
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
