import { Route, Routes } from "react-router-dom"
import HomePage from "./pages/home/HomePage"
import AuthCallBackPage from "./pages/AuthCallBackPage"
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react"
import MainLayout from "./layout/MainLayout"
import ChatPage from "./pages/ChatPage"
import AlbumPage from "./album/AlbumPage"

const App = () => {
  return (
    <>
    <Routes>
      
      <Route 
      path="/sso-callback" 
      element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/callback"}/>} 
      />
      <Route path="/callback" element={<AuthCallBackPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/albums/:albumId" element={<AlbumPage />} />
      </Route>
    </Routes>
    </>
  )
}

export default App