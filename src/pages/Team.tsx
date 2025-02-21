import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ArrowRight, Scissors, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Employee = {
  employee_id: string;
  employee_name: string;
  services: string[];
};

export type EmployeesListItem = {
  employee_id: string;
  employees: Employee[];
};

const Team = () => {
  const [employees, setEmployees] = useState<EmployeesListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesCollection = collection(db, "employees");
        const employeesSnapshot = await getDocs(employeesCollection);

        const employeesList: EmployeesListItem[] = employeesSnapshot.docs.map(
          (doc) => {
            const data = doc.data(); // Get document data
            return {
              employee_id: doc.id,
              employees: data.employees,
            };
          }
        );

        setEmployees(employeesList);
      } catch (error) {
        console.error("Error fetching employees: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const team = employees[0]?.employees || [];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold text-gray-200 mb-4">
          Conheça nosso time
        </h1>
        <p className="text-xl text-gray-400">
          Barbeiros experientes prontos para te atender
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((member) => (
          <Card
            key={member.employee_id}
            className="flex flex-col justify-between border-2 hover:border-primary transition-colors duration-200"
          >
            <CardHeader>
              <UserCircle className="h-12 w-12" />
              <CardTitle className="text-2xl">{member.employee_name}</CardTitle>
            </CardHeader>
            <CardContent>
              {member.services.map((service, index) => (
                <li
                  key={index}
                  className="flex items-center text-sm text-muted-foreground"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  {service}
                </li>
              ))}
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary-hover mt-5"
              >
                <Link to="/book">
                  Book with {member.employee_name.split(" ")[0]}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Team;
