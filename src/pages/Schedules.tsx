import Calendar from "@/components/Calendar";
import { useAuth } from "@/hooks/useAuth";
import { useWebUsers } from "@/hooks/useFirestore";
import { Navigate } from "react-router-dom";

export default function Schedules() {
  const { user: authUser } = useAuth();
  const { webUsers } = useWebUsers();
  const webUser = webUsers.find((user) => user.user_id === authUser?.uid);

  if (webUser?.isAdmin === false) {
    return <Navigate to="/" />;
  }

  return (
    <div className="py-8">
      <div className="space-y-6">
        <Calendar />
      </div>
    </div>
  );
}
