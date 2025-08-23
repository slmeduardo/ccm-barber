import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Management from "./pages/Management";
import Schedules from "./pages/Schedules";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: <Dashboard />,
    children: [
      {
        path: "/",
        element: <Management />,
      },
      {
        path: "dashboard/management",
        element: <Management />,
      },
      {
        path: "dashboard/schedules",
        element: <Schedules />,
      },
    ],
  },
]);
