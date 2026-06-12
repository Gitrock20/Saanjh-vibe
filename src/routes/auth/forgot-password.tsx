import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { logUserActivity } from "@/lib/activity";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Sending reset link...");

    sendPasswordResetEmail(auth, email.trim())
      .then(() => {
        logUserActivity("Password Reset Request", `Requested password reset link for ${email}`);
        toast.dismiss(toastId);
        toast.success("A password reset link has been sent to your email. Check your inbox!");
        navigate({ to: "/auth/login" });
      })
      .catch((error) => {
        toast.dismiss(toastId);
        let errorMsg = error.message || "Failed to send password reset link.";
        if (error.code === "auth/user-not-found") {
          errorMsg = "No account found with this email address.";
        } else if (error.code === "auth/invalid-email") {
          errorMsg = "Please enter a valid email address.";
        }
        toast.error(errorMsg);
        setLoading(false);
      });
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="font-serif text-4xl">Reset password</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Enter your email to receive a secure password reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <Field
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/auth/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-foreground"
      />
    </label>
  );
}
