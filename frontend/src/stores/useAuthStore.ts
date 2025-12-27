import axiosInstance from '@/lib/axios';
import {create} from 'zustand';

interface AuthStore {
    isAdmin: boolean;
    isLoading: boolean;
    error: unknown | null;
    checkAdminStatus: () => Promise<void>;
    reset: () => void;

}

export const useAuthStore = create<AuthStore>((set) => ({
    isAdmin: false,
    isLoading: false,
    error: null,
    checkAdminStatus: async()=> {
        set({isLoading: true, error: null})
        try{
            const response = await axiosInstance.get('/admin/check');
            set({isAdmin: response.data.success, isLoading: false})
        } catch (error){
            set({isAdmin: false, isLoading: false, error: error})
        }
    },
    reset: () => {
        set({isAdmin: false, isLoading: false, error: null})
    }
}));