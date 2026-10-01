import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function AuthSidePanel() {
    return (
        <div className="hidden lg:flex w-[60%] flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-background via-[#0f1b29] to-[#0ea5e9]/20">
            {/* Ambient animated shapes */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl mix-blend-screen"
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.5, 1],
                    rotate: [0, -90, 0],
                    opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl mix-blend-screen"
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center glow-sm mb-4">
                            <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                        NhanZ
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium">
                        Where conversations come alive
                    </p>
                </motion.div>

                {/* Floating chat bubbles decoration */}
                <div className="mt-16 relative w-full h-40">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="absolute left-0 top-0 glass px-4 py-2 rounded-2xl rounded-bl-sm text-sm"
                    >
                        Hey! Have you seen the new design? ✨
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="absolute right-0 top-12 bg-primary/20 backdrop-blur-md px-4 py-2 rounded-2xl rounded-br-sm text-sm border border-primary/30 text-primary-foreground"
                    >
                        It looks amazing! 🚀
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
