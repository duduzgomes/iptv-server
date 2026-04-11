import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login-page";
import { DashboardPage } from "./pages/dashboard-page";
import { UsersPage } from "./pages/users-page";

import { MoviesPage } from "./pages/movies-page";
import { SeriesPage } from "./pages/series-page";
import { SeriesDetailPage } from "./pages/series-detail-page";
import { CategoriesPage } from "./pages/categories-page";
import { AdminsPage } from "./pages/admins-page";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { ChannelsPage } from "./pages/channels-page";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="series" element={<SeriesPage />} />
          <Route path="series/:id" element={<SeriesDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />

          <Route element={<ProtectedRoute requiredRole="SUPERADMIN" />}>
            <Route path="admins" element={<AdminsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
