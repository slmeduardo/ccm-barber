import Calendar from "@/components/Calendar";
import { useAuth } from "@/hooks/useAuth";
import { useWebUsers } from "@/hooks/useFirestore";
import { Navigate } from "react-router-dom";

const Schedules = () => {
  const { user: authUser } = useAuth();
  const { webUsers } = useWebUsers();
  const webUser = webUsers.find((user) => user.user_id === authUser?.uid);

  if (webUser?.isAdmin === false) {
    return <Navigate to="/" />;
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold text-gray-200 mb-4">
          Horários
        </h1>
        <p className="text-xl text-gray-400">
          Calendário com horários marcados
        </p>
      </div>
      <Calendar />
    </div>
  );
};

export default Schedules;
