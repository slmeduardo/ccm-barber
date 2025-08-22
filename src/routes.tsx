import { createBrowserRouter } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Management from "./pages/Management";
import Schedules from "./pages/Schedules";

export const router = createBrowserRouter([
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
