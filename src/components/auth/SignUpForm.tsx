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
import { useToast } from "@/components/ui/use-toast";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Endereço de email inválido"),
    phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
        "Senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [countryCode, setCountryCode] = useState<string>("+55");
  const [phone, setPhone] = useState<string>("");
  const [isValidPhone, setIsValidPhone] = useState<boolean>(false);

  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const { toast } = useToast();

  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    });
  };

  const validatePhone = (phoneNumber: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = phoneNumber.replace(/\D/g, "");
    // Verifica se tem 10 (fixo) ou 11 (celular) dígitos
    const isValid = numbers.length >= 10 && numbers.length <= 11;
    console.log(
      "Números:",
      numbers,
      "Tamanho:",
      numbers.length,
      "Válido:",
      isValid
    ); // Para debug
    setIsValidPhone(isValid);
    return isValid;
  };

  const handlePhoneChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: {
      onChange: (value: string) => void;
      value: string;
    }
  ) => {
    let value = event.target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      // Aplica a máscara
      if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
      }
      if (value.length > 7) {
        value = value.replace(/(\d)(\d{4})$/, "$1-$2");
      }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.get("email") as string,
        formData.get("password") as string
      );

      // Atualizar perfil do usuário com o nome
      await updateProfile(userCredential.user, {
        displayName: formData.get("name") as string,
      });

      // Temporariamente fazer todos os usuários admin
      await api.updateUserRole(userCredential.user.uid, "admin");

      // Forçar atualização do token
      await userCredential.user.getIdToken(true);

      onSuccess?.();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao criar conta",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Select
                        value={countryCode}
                        onValueChange={setCountryCode}
                        defaultValue="+55"
                      >
                        <SelectTrigger className="w-[100px] rounded-r-none">
                          <SelectValue placeholder="País" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="55">🇧🇷 +55</SelectItem>
                          <SelectItem value="1">🇺🇸 +1</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="(00) 00000-0000"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e, field)}
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
          </div>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-2">
                  <FormLabel>Senha</FormLabel>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    onChange={(e) => {
                      field.onChange(e);
                      checkPasswordRequirements(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
                <div className="space-y-2 text-sm mt-2">
                  <div className="flex items-center gap-2">
                    {passwordRequirements.minLength ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordRequirements.minLength
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      Pelo menos 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasUpperCase ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordRequirements.hasUpperCase
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      1 letra maiúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasNumber ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordRequirements.hasNumber
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      1 número
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasSpecial ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passwordRequirements.hasSpecial
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      1 caractere especial
                    </span>
                  </div>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-2">
                  <FormLabel>Confirmar Senha</FormLabel>
                </div>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
