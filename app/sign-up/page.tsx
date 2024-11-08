"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SignUpPage = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);

  if (!isLoaded) {
    return null;
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded) {
      return;
    }
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setPendingVerification(true);
    } catch (error: any) {
      setError(error.errors[0].message);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded) {
      return;
    }
    try {
      const res = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (res.status !== "complete") {
        throw new Error("Verification failed");
      }

      if (res.status === "complete") {
        await setActive({
          session: res.createdSessionId,
        });
        router.push("/dashboard");
      }
    } catch (error: any) {
      setError(error.errors[0].message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6 shadow-lg rounded-lg bg-white">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-center text-gray-800">
            Sign Up for Task Mate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pendingVerification ? (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                />
              </div>
              {error && (
                <Alert
                  variant="destructive"
                  className="mt-4 border border-red-500 bg-red-50"
                >
                  <AlertDescription className="text-red-600">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full py-3 mt-4 font-semibold text-black bg-primary hover:bg-primary-dark rounded-lg"
              >
                Sign Up
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                />
              </div>
              {error && (
                <Alert
                  variant="destructive"
                  className="mt-4 border border-red-500 bg-red-50"
                >
                  <AlertDescription className="text-red-600">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full py-3 mt-4 font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg"
              >
                Verify Email
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;
