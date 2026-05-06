import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import MainLayout from "./components/MainLayout";
import AnniversaryPage from "./pages/AnniversaryPage";
import AlbumPage from "./pages/AlbumPage";
import CouplePage from "./pages/CouplePage";
import DiaryDetailPage from "./pages/DiaryDetailPage";
import DiaryEditorPage from "./pages/DiaryEditorPage";
import DiaryListPage from "./pages/DiaryListPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/couple" element={<CouplePage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/diary" element={<DiaryListPage />} />
          <Route path="/diary/new" element={<DiaryEditorPage />} />
          <Route path="/diary/edit/:id" element={<DiaryEditorPage />} />
          <Route path="/diary/:id" element={<DiaryDetailPage />} />
          <Route path="/album" element={<AlbumPage />} />
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/anniversaries" element={<AnniversaryPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
