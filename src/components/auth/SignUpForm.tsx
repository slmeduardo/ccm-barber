import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createWebUser } from "@/hooks/useFirestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { webuser } from "@/types/webuser";
import { zodResolver } from "@hookform/resolvers/zod";
import bcrypt from "bcryptjs";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExistingUserDialogOpen, setIsExistingUserDialogOpen] =
    useState(false);
  const [existingUser, setExistingUser] = useState<webuser | null>(null);

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
    setIsValidPhone(isValid);
    return isValid;
  };

  const handlePhoneChange = async (
    event: React.FormEvent<HTMLInputElement>,
    field: {
      onChange: (value: string) => void;
      value: string;
    }
  ) => {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, "");

    // Verifica se tem 11 dígitos (com 9 inicial após DDD)
    // Se tiver, remove o 9 após o DDD
    if (value.length === 11 && value.charAt(2) === "9") {
      value = value.substring(0, 2) + value.substring(3);
    }

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

      // Verifica se o número já existe no Firestore
      if (value.length >= 10) {
        const formattedPhone = formatPhoneForDatabase(value, countryCode);

        const usersRef = collection(db, "webUsers");
        const q = query(usersRef, where("phone", "==", formattedPhone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as webuser;
          if (!userData.user_id) {
            setExistingUser(userData);
            setIsExistingUserDialogOpen(true);
            // Preenche o formulário com os dados existentes
            form.setValue("name", userData.name);
            form.setValue("phone", value);
          }
        }
      }
    }
  };

  const formatPhoneForDatabase = (phone: string, countryCode: string) => {
    // Remove todos os caracteres não numéricos
    let cleanNumber = phone.replace(/\D/g, "");

    // Verifica se tem 11 dígitos (inclui o 9 após DDD)
    // Se tiver, remove o 9 após o DDD para padronizar
    if (cleanNumber.length === 11 && cleanNumber.charAt(2) === "9") {
      cleanNumber = cleanNumber.substring(0, 2) + cleanNumber.substring(3);
    }

    // Adiciona o código do país e formata para o padrão do WhatsApp
    cleanNumber = countryCode.replace("+", "") + cleanNumber;
    return `${cleanNumber}@s.whatsapp.net`;
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const formattedPhone = formatPhoneForDatabase(values.phone, countryCode);

      // Gera um hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(values.password, salt);

      if (existingUser) {
        // Atualiza o usuário existente
        const usersRef = collection(db, "webUsers");
        const q = query(usersRef, where("phone", "==", formattedPhone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userId = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          await updateDoc(userDoc.ref, {
            user_id: userId,
            email: values.email,
            password: hashedPassword, // Uso da senha criptografada
            isAdmin: false,
          });

          toast({
            title: "Conta criada com sucesso!",
            description: "Você já pode fazer login.",
          });
          onSuccess?.();
        }
      } else {
        // Cria um novo usuário
        const userId = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const webUser: webuser = {
          user_id: userId,
          name: values.name,
          email: values.email,
          phone: formattedPhone,
          password: hashedPassword, // Uso da senha criptografada
          isAdmin: false,
        };

        const usersRef = collection(db, "webUsers");
        const q = query(usersRef, where("phone", "==", formattedPhone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          throw new Error("Este número já está cadastrado");
        }

        await createWebUser(webUser);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao criar conta",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      className="text-sm"
                      placeholder="John Doe"
                      {...field}
                    />
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
                      placeholder="email@exemplo.com"
                      type="email"
                      {...field}
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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Select
                          value={countryCode}
                          onValueChange={setCountryCode}
                        >
                          <SelectTrigger className="w-[100px] h-8 rounded-r-none">
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
                          onChangeCapture={(event) =>
                            handlePhoneChange(event, field)
                          }
                          maxLength={15}
                          className={cn(
                            "flex-1 rounded-l-none border-l-0 text-sm",
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
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
      </Form>

      <Dialog
        open={isExistingUserDialogOpen}
        onOpenChange={setIsExistingUserDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuário Encontrado</DialogTitle>
            <DialogDescription>
              Identificamos que você já interagiu com nosso chatbot. Complete
              seu cadastro preenchendo os campos restantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Nome: {existingUser?.name}</p>
            <p>Telefone: {phone}</p>
            <p>
              Por favor, preencha seu email e senha para completar o cadastro.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
