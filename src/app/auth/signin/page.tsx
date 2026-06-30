"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            CivicEye
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Continue with Google
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => signIn("credentials", { callbackUrl: "/" })}
          >
            Continue with Email (demo)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
