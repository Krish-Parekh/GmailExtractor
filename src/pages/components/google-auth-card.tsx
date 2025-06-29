import React, { useState } from "react";
import Container from "./container";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn, useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function GoogleAuthCard() {
    const { status } = useSession();
    const handleSignIn = async () => {
        await signIn("google");
    }
    return (
        <Container className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign in to Gmail Extractor</CardTitle>
                    <CardDescription>Connect your Google account to access your Gmail attachments</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full bg-white text-black" onClick={handleSignIn} disabled={status === "loading"}>
                        {status === "loading" && <Loader2 className="mr-2 size-5 animate-spin" />}
                        <FcGoogle className="mr-2 size-5" />
                        Sign up with Google
                    </Button>
                </CardContent>
            </Card>
        </Container>
    );
}