import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthLayout } from "../components/layout";
import { Alert, Button, Input } from "../components/ui";

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationState = location.state as { from?: string; message?: string } | null;
  const redirectTo = locationState?.from ?? "/";
  const flashMessage = locationState?.message ?? null;

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setIsSubmitting(false);
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your CRO audit dashboard."
      footer={
        <>
          No account yet? <Link to="/register">Create one</Link>
        </>
      }
    >
      {flashMessage && <Alert variant="success" role="status">{flashMessage}</Alert>}

      <form className="ds-auth-form" onSubmit={handleSubmit}>
        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isSubmitting}
        />

        <Input
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          disabled={isSubmitting}
        />

        {error && <Alert variant="error">{error}</Alert>}

        <Button type="submit" size="full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
