import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div>
      <aside>Sidebar</aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
