import prisma from "./prisma";

export const AI_BOT_ID = "system-ai-bot";

export async function ensureAIBot() {
    try {
        const aiBot = await prisma.user.findUnique({ where: { id: AI_BOT_ID } });
        if (!aiBot) {
            await prisma.user.create({
                data: {
                    id: AI_BOT_ID,
                    email: "ai@nhanz.app",
                    username: "AI_Assistant",
                    name: "AI Bot",
                    password: "no-password-needed",
                    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=NhanZAI",
                }
            });
            console.log("AI Bot user created in database.");
        }
    } catch (e) {
        console.error("Failed to ensure AI bot exists:", e);
    }
}

export async function generateAIResponse(text: string, context?: any): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerText = text.toLowerCase();

    if (lowerText.includes("summarize")) {
        return "✨ **Summary:**\nYou and the other members have been discussing the implementation of new WOW features, UI improvements, and general chat enhancements. Keep up the good work!";
    }

    if (lowerText.includes("translate")) {
        return "🌍 **Translation:**\n*(Simulated)* ¡Hola! Me parece genial. ¿Cómo estás?";
    }

    if (lowerText.includes("explain")) {
        return "🧠 **Explanation:**\nWebRTC is a free and open-source project that provides web browsers and mobile applications with real-time communication via simple APIs. It allows audio and video communication to work inside web pages.";
    }

    if (lowerText.includes("weather")) {
        return "⛅ **Weather:**\nI am currently a simulated AI, but I imagine it's a beautiful sunny day with a high of 75°F (24°C) wherever you are!";
    }

    return "🤖 Hello! I am the NhanZ AI Assistant. I can help you `/ai summarize` conversations, `/ai translate to [language]` messages, or `/ai explain [topic]` concepts. How can I help you today?";
}
