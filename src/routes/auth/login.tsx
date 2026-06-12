import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { useState } from "react";
import { toast } from "sonner";
import { logUserActivity, registerCustomer } from "@/lib/activity";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, signOut } from "firebase/auth";

export const Route = createFileRoute("/auth/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Signing you in...");

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        
        // Check if email is verified
        if (!user.emailVerified) {
          try {
            await sendEmailVerification(user);
          } catch (resendError) {
            console.warn("Failed to resend verification email on login check:", resendError);
          }
          await signOut(auth);
          toast.dismiss(toastId);
          toast.warning("Please verify your email first. We have resent a verification link to your inbox.", {
            duration: 10000,
          });
          setLoading(false);
          return;
        }

        const name = user.displayName || email.split("@")[0];
        localStorage.setItem("saanjh_user_session", JSON.stringify({ email, name }));
        registerCustomer(name, email);
        logUserActivity("User Login", `Logged in as ${name} (${email}) via Firebase`);

        toast.dismiss(toastId);
        toast.success("Welcome back to Saanjh!");
        navigate({ to: "/" });
      })
      .catch((error) => {
        toast.dismiss(toastId);
        toast.error(error.message || "Failed to sign in. Please check credentials.");
        setLoading(false);
      });
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    const toastId = toast.loading("Connecting with Google...");
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        const name = user.displayName || user.email?.split("@")[0] || "User";
        const emailAddress = user.email || "";
        localStorage.setItem("saanjh_user_session", JSON.stringify({ email: emailAddress, name }));
        registerCustomer(name, emailAddress);
        logUserActivity("User Login", `Logged in via Google as ${name} (${emailAddress})`);

        toast.dismiss(toastId);
        toast.success("Welcome back to Saanjh!");
        navigate({ to: "/" });
      })
      .catch((error) => {
        toast.dismiss(toastId);
        toast.error(error.message || "Failed to connect with Google.");
        setLoading(false);
      });
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="font-serif text-4xl">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">Sign in to your Saanjh account.</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
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
            rightElement={
              <Link
                to="/auth/forgot-password"
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition underline underline-offset-4"
              >
                Forgot?
              </Link>
            }
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full border border-border py-4 text-xs uppercase tracking-[0.24em] hover:border-foreground disabled:opacity-50 transition cursor-pointer"
        >
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to Saanjh?{" "}
          <Link to="/auth/signup" className="text-foreground underline underline-offset-4">
            Create account
          </Link>
        </p>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <Link to="/admin" className="text-xs uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition underline underline-offset-4">
            Admin login & dashboard →
          </Link>
        </div>
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
