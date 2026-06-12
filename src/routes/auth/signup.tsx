import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { logUserActivity, registerCustomer } from "@/lib/activity";

export const Route = createFileRoute("/auth/signup")({ component: Signup });

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "verification">("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Creating your account...");
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Update display name
      await updateProfile(user, { displayName: fullName });

      // 3. Send Native Email Verification
      await sendEmailVerification(user);

      // 4. Activity Logs
      registerCustomer(fullName, email.trim());
      logUserActivity("User Signup Init", `Registered new account for ${fullName} (${email.trim()}). Verification email sent.`);

      // 5. Sign out immediately so they cannot bypass verification
      await signOut(auth);

      toast.dismiss(toastId);
      toast.success("Registration successful! Check your email to verify your account.");
      setStep("verification");
    } catch (error: any) {
      toast.dismiss(toastId);
      let errorMsg = error.message || "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "This email is already registered. Please sign in or use a different email.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading("Resending verification email...");
    try {
      // In Firebase Client SDK, sendEmailVerification requires a signed-in session.
      // We log them in temporarily in the background, send it, and log out again.
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      toast.dismiss(toastId);
      toast.success("Verification email resent successfully! Check your inbox.");
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to resend verification link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-5 py-20">
        {step === "details" ? (
          <>
            <h1 className="font-serif text-4xl">Create account</h1>
            <p className="mt-2 text-muted-foreground">Join Saanjh for early access and 10% off your first order.</p>

            <form onSubmit={handleSignup} className="mt-10 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="First name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
                <Field
                  label="Last name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Field
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Field
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-foreground underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-4xl">Verify your email</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We have sent a secure verification link to <strong className="text-foreground font-normal">{email}</strong>.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Please check your inbox and click the verification link to activate your account. Once verified, you will be able to sign in successfully.
            </p>

            <div className="mt-10 space-y-4">
              <Link
                to="/auth/login"
                className="block w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 transition text-center"
              >
                Go to Sign In
              </Link>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full border border-border py-4 text-xs uppercase tracking-[0.24em] hover:border-foreground disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? "Resending..." : "Resend verification link"}
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setStep("details")}
                disabled={loading}
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition underline underline-offset-4 cursor-pointer bg-transparent border-0 self-center"
              >
                ← Back / Edit Details
              </button>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}

function Field({
  label,
  rightElement,
  ...props
}: { label: string; rightElement?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="flex justify-between items-center">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        {rightElement}
      </div>
      <input
        {...props}
        className={`mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-foreground ${props.className || ""}`}
      />
    </label>
  );
}

