import { Route, Routes } from "react-router-dom"
import HomePage from "./pages/HomePage"
import AuthCallBackPage from "./pages/AuthCallBackPage"
import axiosInstance from "./lib/axios"
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react"

const App = () => {
  return (
    <>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route 
      path="/sso-callback" 
      element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/callback"}/>} 
      />
      <Route path="/callback" element={<AuthCallBackPage />} />
    </Routes>
    </>
  )
}

export default App