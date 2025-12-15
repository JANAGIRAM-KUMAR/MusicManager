import { Card, CardContent } from "@/components/ui/card"
import axiosInstance from "@/lib/axios"
import { useUser } from "@clerk/clerk-react"
import { Loader } from "lucide-react"
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

const AuthCallBackPage = () => {
  const {isLoaded, user} = useUser();
  const navigate = useNavigate();
  const syncAttempted = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      if(!isLoaded || !user || syncAttempted.current) return; // The fn will run only once
      try{
        syncAttempted.current = true;
        await axiosInstance.post('/auth/callback', {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl
        })
      } catch (error){
        console.log("Error in auth callback page", error);
      }finally{
        navigate('/');
      }
    }
    syncUser();
  }, [isLoaded, user]);

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <Card  className="w-[90%] max-w-md bg-zinc-800 border-b-zinc-900">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <Loader className="size-6 text-blue-500 animate-spin" />
          <h3 className="text-zinc-400 text-xl font-bold">Logging In</h3>
          <p className="text-zinc-400 text-sm">Redirecting.....</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallBackPage