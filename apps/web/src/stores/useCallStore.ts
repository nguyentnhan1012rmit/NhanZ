import { create } from "zustand";

interface CallState {
    callStatus: 'idle' | 'calling' | 'incoming' | 'connected';
    otherUserId: string | null;
    otherUserName: string | null;
    isVideo: boolean;
    setCallStatus: (status: 'idle' | 'calling' | 'incoming' | 'connected') => void;
    setCallData: (userId: string, userName: string, isVideo: boolean) => void;
    resetCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
    callStatus: 'idle',
    otherUserId: null,
    otherUserName: null,
    isVideo: false,
    setCallStatus: (status) => set({ callStatus: status }),
    setCallData: (userId, userName, isVideo) => set({ otherUserId: userId, otherUserName: userName, isVideo }),
    resetCall: () => set({ callStatus: 'idle', otherUserId: null, otherUserName: null, isVideo: false })
}));
