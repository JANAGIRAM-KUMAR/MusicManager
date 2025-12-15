import { useSignIn } from "@clerk/clerk-react"
import { Button } from "./ui/button";

const SignInOAuthButtons = () => {
   const {signIn, isLoaded}= useSignIn()
    if(!isLoaded){
        return null;
    }

    const signInWithGoogle = async () => {
        await signIn.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: "/sso-callback",
            redirectUrlComplete: "/callback"
        })
    }
    
    return <Button onClick={signInWithGoogle} variant="secondary" className="w-full text-white border-zinc-200 h-11">
        Continue With Google
    </Button>
}

export default SignInOAuthButtons