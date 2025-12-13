import axiosInstance from "@/lib/axios";
import { useAuth } from "@clerk/clerk-react"
import { useEffect, useState } from "react";
import { Loader } from "lucide-react"

const updateToken = (token: string | null) => {
    if(token){
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
        delete axiosInstance.defaults.headers.common['Authorization']
    }
}

const AuthProvider = ({children} : {children: React.ReactNode}) => {
    const {getToken} = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try{
                const token = await getToken();
                updateToken(token);
            } catch(error){
                console.log("Error in auth provider", error);
                updateToken(null);
            } finally {
                setLoading(false);
            }
        }
        initAuth();
    }, [getToken])
  
    if(loading){
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader className="size-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <>{children}</>
    )
}

export default AuthProvider