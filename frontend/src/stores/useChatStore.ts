import axiosInstance from '@/lib/axios';
import {create} from 'zustand';

interface ChatStore {
    users: any[];
    fetchUsers: () => Promise<void>;
    isLoading: boolean;
    error: unknown;
}

export const useChatStore = create<ChatStore>((set) => ({
    users: [],
    isLoading: false,
    error: null,
    fetchUsers: async() => {
        set({isLoading: true, error: null})
        try{
            const response = await axiosInstance.get('/users');
            set({users: response.data, isLoading: false})
        } catch(error) {
            set({error: error, isLoading: false})
        }
    },
   
}));