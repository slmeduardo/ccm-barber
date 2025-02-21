import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      console.log("Usuário logado:", {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        emailVerified: userCredential.user.emailVerified,
      });

      onSuccess?.();
    } catch (error: any) {
      const errorMessage = "Ocorreu um erro ao fazer login.";

      switch (error.code) {
        case "auth/invalid-email":
          form.setError("email", { message: "O formato do email é inválido." });
          break;
        case "auth/user-disabled":
          form.setError("email", { message: "Esta conta foi desativada." });
          break;
        case "auth/user-not-found":
          form.setError("email", {
            message:
              "Email não encontrado. Por favor, verifique suas credenciais.",
          });
          break;
        case "auth/wrong-password":
          form.setError("password", {
            message: "Senha incorreta. Por favor, tente novamente.",
          });
          break;
        case "auth/too-many-requests":
          form.setError("root", {
            message:
              "Muitas tentativas de login. Por favor, tente novamente mais tarde.",
          });
          break;
        case "auth/network-request-failed":
          form.setError("root", {
            message: "Erro de conexão. Verifique sua internet.",
          });
          break;
        default:
          console.error("Erro ao fazer login:", error);
          form.setError("root", {
            message: "Ocorreu um erro ao fazer login. Tente novamente.",
          });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="email@example.com"
                  {...field}
                  type="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <div className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
          Entrar
        </Button>
      </form>
    </Form>
  );
}
