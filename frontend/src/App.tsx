import { Route, Routes } from "react-router-dom"
import HomePage from "./pages/home/HomePage"
import AuthCallBackPage from "./pages/AuthCallBackPage"
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react"
import MainLayout from "./layout/MainLayout"
import ChatPage from "./pages/ChatPage"
import AlbumPage from "./album/AlbumPage"
import AdminPage from "./pages/admin/AdminPage"

import { Toaster } from "react-hot-toast"

const App = () => {
  return (
    <>
    <Routes>
      
      <Route 
      path="/sso-callback" 
      element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/callback"}/>} 
      />
      <Route path="/callback" element={<AuthCallBackPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/albums/:albumId" element={<AlbumPage />} />
      </Route>
    </Routes>
    <Toaster />
    </>
  )
}

export default App