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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { webuser } from "@/types/webuser";
import { zodResolver } from "@hookform/resolvers/zod";
import bcrypt from "bcryptjs";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

const formSchema = z.object({
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const [countryCode, setCountryCode] = useState<string>("+55");
  const [phone, setPhone] = useState<string>("");
  const [isValidPhone, setIsValidPhone] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validatePhone = (phoneNumber: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = phoneNumber.replace(/\D/g, "");
    // Verifica se tem 10 (fixo) ou 11 (celular) dígitos
    const isValid = numbers.length >= 10 && numbers.length <= 11;
    setIsValidPhone(isValid);
    return isValid;
  };

  const handlePhoneChange = (
    event: React.FormEvent<HTMLInputElement>,
    field: {
      onChange: (value: string) => void;
      value: string;
    }
  ) => {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      // Aplica a máscara
      if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
      }
      if (value.length > 7) {
        value = value.replace(/(\d)(\d{4})$/, "$1-$2");
      }
      target.value = value;

      setPhone(value);
      // Valida o número a cada mudança
      validatePhone(value);
      // Atualiza o valor no formulário
      field.onChange(value);
    }
  };

  const formatPhoneForDatabase = (phone: string, countryCode: string) => {
    const cleanNumber = countryCode.replace("+", "") + phone.replace(/\D/g, "");
    return `${cleanNumber}@s.whatsapp.net`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Formata o telefone para buscar no banco de dados
      const formattedPhone = formatPhoneForDatabase(values.phone, countryCode);

      // Busca o usuário pelo telefone
      const usersRef = collection(db, "webUsers");
      const q = query(usersRef, where("phone", "==", formattedPhone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Telefone ou senha incorretos");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as webuser;

      // Compara a senha fornecida com o hash armazenado
      const isPasswordValid = await bcrypt.compare(
        values.password,
        userData.password
      );

      if (!isPasswordValid) {
        throw new Error("Telefone ou senha incorretos");
      }

      // Se chegou aqui, a senha está correta
      // Salve os dados do usuário na sessão, local storage, ou context
      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: userData.user_id,
          name: userData.name,
          email: userData.email,
          isAdmin: userData.isAdmin,
        })
      );

      // Login bem-sucedido - use a função login do contexto, se disponível
      login?.(userData);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a) de volta, ${userData.name}!`,
      });

      // Redireciona ou executa alguma função após o login
      onSuccess?.();

      // Navegue para a página apropriada
      userData.isAdmin ? navigate("/dashboard") : navigate("/");
    } catch (error) {
      console.error("Erro no login:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao fazer login",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <div className="flex">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[100px] rounded-r-none">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+55">🇧🇷 +55</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChangeCapture={(e) => handlePhoneChange(e, field)}
                    maxLength={15}
                    className={cn(
                      "flex-1 rounded-l-none border-l-0",
                      phone &&
                        !isValidPhone &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
                    {...field}
                  />
                </div>
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
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Form>
  );
}
