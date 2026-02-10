"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error(error.message);
                setLoading(false);
                return;
            }

            // Success - Show transition
            setShowWelcome(true);
            setTimeout(() => {
                router.push("/");
                router.refresh();
            }, 2000); // Wait for 2 seconds animation
        } catch {
            toast.error("Terjadi kesalahan");
            setLoading(false);
        }
    }

    if (showWelcome) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
                    <span className="text-5xl font-bold text-black">S</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-in slide-in-from-bottom-5 duration-1000">
                    Welcome to <span className="text-amber-500">STYLK POS</span>
                </h1>
                <p className="text-zinc-400 text-lg animate-in slide-in-from-bottom-5 duration-1000 delay-200">
                    Menyiapkan dashboard anda...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-2">
                        <span className="text-3xl font-bold text-black">S</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">POS STYLK</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Masuk untuk melanjutkan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@stylk.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Masuk"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
