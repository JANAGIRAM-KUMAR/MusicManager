import { useState } from "react";
import type { ReactNode } from "react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/useAuthStore";

interface SignInButtonProps {
  children?: ReactNode;
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const SignInButton = ({ children }: SignInButtonProps) => {
  const [open, setOpen] = useState(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);
  const isSigningIn = useAuthStore((state) => state.isSigningIn);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error("Google did not return a credential");
      return;
    }

    const success = await signInWithGoogle(response.credential);
    if (success) {
      setOpen(false);
      toast.success("Signed in with Google");
    } else {
      toast.error(useAuthStore.getState().error ?? "Google sign-in failed");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signInWithEmail(loginEmail, loginPassword);
    if (success) {
      setOpen(false);
      toast.success("Signed in");
      setLoginEmail("");
      setLoginPassword("");
    } else {
      toast.error(useAuthStore.getState().error ?? "Login failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signUpWithEmail(regName, regEmail, regPassword);
    if (success) {
      setOpen(false);
      toast.success("Account created");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } else {
      toast.error(useAuthStore.getState().error ?? "Registration failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200">
            Sign in
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to Soundwave</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Continue with Google or sign in with your email and password.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {clientId ? (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast.error("Google sign-in was cancelled")}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
              width="320"
            />
          ) : (
            <div className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <p className="font-semibold">Google sign-in is not configured.</p>
              <p className="mt-1 text-xs">
                Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code className="ml-1">frontend/.env.local</code>
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-950 px-2 text-zinc-500">or</span>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="register">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="border-zinc-800 bg-zinc-900"
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="border-zinc-800 bg-zinc-900"
              />
              <Button type="submit" disabled={isSigningIn} className="w-full bg-emerald-500 text-black hover:bg-emerald-400">
                {isSigningIn ? "Signing in..." : "Log in"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-3">
              <Input
                placeholder="Full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                className="border-zinc-800 bg-zinc-900"
              />
              <Input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="border-zinc-800 bg-zinc-900"
              />
              <Input
                type="password"
                placeholder="Password (min 6 chars)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                minLength={6}
                required
                className="border-zinc-800 bg-zinc-900"
              />
              <Button type="submit" disabled={isSigningIn} className="w-full bg-emerald-500 text-black hover:bg-emerald-400">
                {isSigningIn ? "Creating account..." : "Sign up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {isSigningIn && (
          <p className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Loader2 className="size-3.5 animate-spin" />
            Signing you in…
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
