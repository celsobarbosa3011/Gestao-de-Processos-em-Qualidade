import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useStore } from "@/lib/store";
import { useCreateProcess } from "@/hooks/use-processes";

const processSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(5, "Descrição necessária"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  type: z.string().min(1, "Tipo é obrigatório"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  deadline: z.string().optional(),
});

interface CreateProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProcessDialog({ open, onOpenChange }: CreateProcessDialogProps) {
  const { currentUser } = useStore();
  const createProcess = useCreateProcess();
  
  const form = useForm<z.infer<typeof processSchema>>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      title: "",
      description: "",
      unit: currentUser?.unit || "",
      type: "Administrativo",
      priority: "medium",
    },
  });

  const onSubmit = async (values: z.infer<typeof processSchema>) => {
    if (!currentUser) return;
    
    await createProcess.mutateAsync({
      ...values,
      responsibleId: currentUser.id,
      status: 'new',
      deadline: values.deadline ? new Date(values.deadline) : undefined,
    });
    
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Processo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input data-testid="input-title" placeholder="Ex: Compra de Material" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea data-testid="input-description" placeholder="Detalhes da solicitação..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input data-testid="input-type" placeholder="Ex: RH, Financeiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <FormControl>
                    <Input data-testid="input-unit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo (Opcional)</FormLabel>
                  <FormControl>
                    <Input data-testid="input-deadline" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button data-testid="button-create" type="submit" disabled={createProcess.isPending}>
                {createProcess.isPending ? "Criando..." : "Criar Processo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
