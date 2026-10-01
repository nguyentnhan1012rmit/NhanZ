import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginSchema } from "@nhanz/shared";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthSidePanel } from "@/components/AuthSidePanel";

export default function LoginPage() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const login = useAuthStore((state) => state.login);

    async function onSubmit(values: z.infer<typeof LoginSchema>) {
        try {
            const res = await api.post("/api/auth/login", values);
            login(res.data.user, res.data.token);
            toast.success("Logged in successfully!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Login failed");
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AuthSidePanel />
            <div className="w-full lg:w-[40%] flex items-center justify-center p-8 relative">
                {/* Mobile header (hidden on desktop) */}
                <div className="absolute top-8 left-8 lg:hidden font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">NhanZ</div>

                <div className="w-full max-w-md space-y-8 glass p-8 rounded-3xl border border-white/5">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h2>
                        <p className="text-muted-foreground">Login to your account to continue</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your email" className="bg-black/20 border-white/10 focus-visible:ring-primary/50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter your password" className="bg-black/20 border-white/10 focus-visible:ring-primary/50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-[#0284c7] hover:opacity-90 glow-sm border-0 mt-4">
                                Login
                            </Button>
                        </form>
                    </Form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-muted-foreground">Or continue with</span></div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" className="w-full glass border-white/10 hover:bg-white/5">GitHub</Button>
                        <Button variant="outline" className="w-full glass border-white/10 hover:bg-white/5">Google</Button>
                    </div>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
