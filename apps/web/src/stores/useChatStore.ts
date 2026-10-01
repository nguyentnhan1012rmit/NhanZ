import { create } from "zustand";
import { api } from "@/lib/api";
import { useAuthStore } from "./useAuthStore";

interface User {
    id: string;
    username: string;
    avatar?: string;
    name?: string;
    email?: string;
}

interface Conversation {
    id: string;
    isGroup: boolean;
    name?: string;
    members: { user: User }[];
    updatedAt: string;
    messages?: { content: string; createdAt: string; senderId?: string }[]; // From backend includes
}

interface ChatState {
    users: User[];
    conversations: Conversation[];
    activeConversationId: string | null;
    isLoading: boolean;
    onlineUsers: Set<string>;
    unreadCounts: Record<string, number>;

    setOnlineUsers: (users: string[]) => void;
    addUserOnline: (userId: string) => void;
    removeUserOffline: (userId: string) => void;
    incrementUnreadCount: (conversationId: string) => void;
    clearUnreadCount: (conversationId: string) => void;

    fetchUsers: () => Promise<void>;
    fetchConversations: () => Promise<void>;
    startConversation: (targetUserId: string) => Promise<void>;
    createGroup: (name: string, userIds: string[]) => Promise<void>;
    setActiveConversation: (id: string) => void;
    updateConversationLastMessage: (conversationId: string, message: { content: string; createdAt: string }) => void;

    // Typing state: conversationId -> [username1, username2]
    typingUsers: Record<string, string[]>;
    setTyping: (conversationId: string, username: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    users: [],
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    onlineUsers: new Set(),
    unreadCounts: {},

    setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
    addUserOnline: (userId) => set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.add(userId);
        return { onlineUsers: newSet };
    }),
    removeUserOffline: (userId) => set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.delete(userId);
        return { onlineUsers: newSet };
    }),
    incrementUnreadCount: (conversationId) => set((state) => ({
        unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: (state.unreadCounts[conversationId] || 0) + 1
        }
    })),
    clearUnreadCount: (conversationId) => set((state) => ({
        unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: 0
        }
    })),

    fetchUsers: async () => {
        try {
            set({ isLoading: true });
            const user = useAuthStore.getState().user;
            if (!user) return;

            // Hack: Pass ID in header because we don't have middleware yet
            const res = await api.get("/api/app/users", {
                headers: { 'x-user-id': user.id }
            });
            set({ users: res.data });
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchConversations: async () => {
        try {
            set({ isLoading: true });
            const user = useAuthStore.getState().user;
            if (!user) return;

            const res = await api.get("/api/app", {
                headers: { 'x-user-id': user.id }
            });
            set({ conversations: res.data });
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            set({ isLoading: false });
        }
    },

    startConversation: async (targetUserId: string) => {
        try {
            const user = useAuthStore.getState().user;
            if (!user) return;

            const res = await api.post("/api/app", { targetUserId }, {
                headers: { 'x-user-id': user.id }
            });

            const newConv = res.data;
            set((state) => {
                // Check if already exists in list to avoid duplicates
                const exists = state.conversations.find(c => c.id === newConv.id);
                if (exists) return { activeConversationId: newConv.id };

                // Add to list and set active
                // For simplified flow, we might just refetch or push
                return {
                    conversations: [newConv, ...state.conversations],
                    activeConversationId: newConv.id
                };
            });

            // Reload conversations to get full member details if needed
            get().fetchConversations();

        } catch (error) {
            console.error("Failed to start conversation", error);
        }
    },

    createGroup: async (name, userIds) => {
        try {
            set({ isLoading: true });
            const user = useAuthStore.getState().user;
            if (!user) return;

            const res = await api.post("/api/app/group", { name, userIds }, {
                headers: { 'x-user-id': user.id }
            });

            const newConv = res.data;
            set((state) => ({
                conversations: [newConv, ...state.conversations],
                activeConversationId: newConv.id
            }));

            // Reload conversations to get full member details
            get().fetchConversations();
        } catch (error) {
            console.error("Failed to create group", error);
        } finally {
            set({ isLoading: false });
        }
    },

    setActiveConversation: (id) => {
        set({ activeConversationId: id });
        useChatStore.getState().clearUnreadCount(id);
    },

    updateConversationLastMessage: (conversationId, message) => set((state) => {
        const updatedConversations = state.conversations.map(c => {
            if (c.id === conversationId) {
                return {
                    ...c,
                    messages: [message],
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        });

        updatedConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());


        return { conversations: updatedConversations };
    }),

    typingUsers: {},
    setTyping: (conversationId, username, isTyping) => set((state) => {
        const currentTyping = state.typingUsers[conversationId] || [];
        let newTyping = [...currentTyping];

        if (isTyping) {
            if (!newTyping.includes(username)) newTyping.push(username);
        } else {
            newTyping = newTyping.filter(u => u !== username);
        }

        return {
            typingUsers: {
                ...state.typingUsers,
                [conversationId]: newTyping
            }
        };
    })
}));
