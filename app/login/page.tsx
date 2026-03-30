"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Ship, Check, AlertCircle } from "lucide-react";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await authService.login({ email, password });
            // Get tenants from localStorage and parse JSON
            const tenantsStr = localStorage.getItem("tenants");
            if (tenantsStr) {
                const tenants = JSON.parse(tenantsStr);
                let slug = tenants[0]?.slug;
                if (!slug && tenants[0]?.name) {
                    slug = tenants[0].name
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '') 
                        .replace(/\s+/g, '-')      
                        .replace(/-+/g, '-');      
                }
                
                router.push(`/${slug}/dashboard`);
            } else {
                router.push("/tenant-1/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full font-display bg-[#f6f8f8] dark:bg-[#102022] text-[#111718] dark:text-[#f0f4f4]">
            {/* Left Side: Visual Narrative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCCfnRDKcA1kXfM5ydH86c2pfJ--iTfSPjGVcsXKonZ0cngZkOEm-SLZzM2ddaKS_8tydMEiSZVbxLqOyk-m_jyyii9hdE8Vfah828WyzulfRSy1Yk_t-zN4nIZHegcy96VEMimimh6WNlGs6iV3-4M7WPrLocM-ZM_iOycm6iAKN76kxqNEU7WchkrUf0zh8VBy-aBpf3yo4KwaeHJVnyHTIWeP1t10mLJ1U4ErqWt8RLc09GTjCFMESWEIyLCcj5qi_s6-20glQ')" }}
                />
                {/* Teal Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#102022]/90 via-primary/40 to-transparent"></div>
                
                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white">
                    <div className="max-w-md">
                        <h3 className="text-3xl font-black leading-snug mb-2 tracking-tight uppercase">
                            Ayahay Business<br/>Intelligence Dashboard
                        </h3>
                        <p className="text-base font-normal text-white/90 leading-relaxed italic">
                            "Ang Pagsakay Dapat Ayahay"
                        </p>
                    </div>
                    <div className="mt-12 flex items-center gap-4">
                        <div className="w-12 h-1 bg-primary rounded-full"></div>
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Ayahay BI Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Interaction Panel */}
            <div className="flex flex-col flex-1 justify-center items-center bg-white dark:bg-[#102022] px-6 py-12 lg:px-24">
                <div className="w-full max-w-[440px] flex flex-col gap-10">
                    {/* Logo & Header */}
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-lg">
                                <Ship className="text-white size-8 fill-current" />
                            </div>
                            <span className="text-2xl font-black text-[#111718] dark:text-white tracking-tighter uppercase">Ayahay BI DASHBOARD</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-black text-[#111718] dark:text-white leading-tight">Welcome back</h1>
                            <p className="text-[#618689] dark:text-gray-400 text-base">Enter your credentials to access the maritime intelligence dashboard.</p>
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="size-5" />
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                        {/* Email Input */}
                        <div className="relative w-full h-16 group">
                            <input 
                                id="email" 
                                type="email" 
                                placeholder="Email Address" 
                                className="peer block w-full h-full px-4 pt-6 pb-2 text-base font-medium text-[#111718] dark:text-white bg-[#f0f4f4] dark:bg-[#1a2e31] border-none rounded-lg focus:ring-2 focus:ring-primary placeholder-transparent outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                            <label 
                                htmlFor="email"
                                className="absolute left-4 top-0 pointer-events-none transition-all duration-200 origin-left text-sm font-medium text-[#618689] peer-placeholder-shown:translate-y-[1.2rem] peer-placeholder-shown:scale-100 peer-focus:translate-y-[0.25rem] peer-focus:scale-85 peer-focus:text-primary peer-current:translate-y-[0.25rem] peer-current:scale-85"
                            >
                                Email Address
                            </label>
                        </div>

                        {/* Password Input */}
                        <div className="relative w-full h-16 group">
                            <input 
                                id="password" 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                className="peer block w-full h-full px-4 pt-6 pb-2 text-base font-medium text-[#111718] dark:text-white bg-[#f0f4f4] dark:bg-[#1a2e31] border-none rounded-lg focus:ring-2 focus:ring-primary placeholder-transparent outline-none transition-all pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                            <label 
                                htmlFor="password"
                                className="absolute left-4 top-0 pointer-events-none transition-all duration-200 origin-left text-sm font-medium text-[#618689] peer-placeholder-shown:translate-y-[1.2rem] peer-placeholder-shown:scale-100 peer-focus:translate-y-[0.25rem] peer-focus:scale-85 peer-focus:text-primary peer-current:translate-y-[0.25rem] peer-current:scale-85"
                            >
                                Password
                            </label>
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#618689] hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" 
                                />
                                <span className="text-sm text-[#618689] dark:text-gray-400 font-medium">Remember me</span>
                            </label>
                            <a href="#" className="text-sm font-bold text-primary hover:underline underline-offset-4">Forgot Password?</a>
                        </div>

                        {/* Sign In Button */}
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-14 bg-gradient-to-r from-primary to-[#3f68e4] hover:brightness-110 active:scale-[0.98] transition-all text-white font-bold text-lg rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span>{isLoading ? "Loging In..." : "Login In"}</span>
                            {/* <LogIn className="size-5" /> */}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="flex flex-col gap-4 text-center pt-4 border-t border-[#f0f4f4] dark:border-[#1a2e31]">
                        <p className="text-[#618689] dark:text-gray-400 text-sm">
                            Don&apos;t have an account? 
                            <a href="#" className="text-[#111718] dark:text-white font-bold hover:text-primary transition-colors ml-1">Request Access</a>
                        </p>
                        <div className="flex justify-center gap-6">
                            <a href="#" className="text-xs text-[#618689] dark:text-gray-500 hover:text-primary transition-colors font-medium">Help Center</a>
                            <a href="#" className="text-xs text-[#618689] dark:text-gray-500 hover:text-primary transition-colors font-medium">Terms of Service</a>
                            <a href="#" className="text-xs text-[#618689] dark:text-gray-500 hover:text-primary transition-colors font-medium">Privacy Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
