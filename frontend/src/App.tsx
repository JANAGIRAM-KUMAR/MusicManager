import { Route, Routes } from "react-router-dom"
import HomePage from "./pages/HomePage"
import AuthCallBackPage from "./pages/AuthCallBackPage"
import axiosInstance from "./lib/axios"

const App = () => {
  return (
    <>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/callback" element={<AuthCallBackPage />} />
    </Routes>
    </>
  )
}

export default App