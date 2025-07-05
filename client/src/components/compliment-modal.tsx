import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Heart, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const complimentSchema = z.object({
  toEmployeeId: z.string().min(1, "Selecteer een collega"),
  message: z.string().min(10, "Bericht moet minimaal 10 karakters zijn"),
});

type ComplimentFormData = z.infer<typeof complimentSchema>;

interface ComplimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: any[];
}

export function ComplimentModal({ isOpen, onClose, employees = [] }: ComplimentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ComplimentFormData>({
    resolver: zodResolver(complimentSchema),
    defaultValues: {
      toEmployeeId: "",
      message: "",
    },
  });

  const sendComplimentMutation = useMutation({
    mutationFn: async (data: ComplimentFormData) => {
      const response = await apiRequest('POST', '/api/compliments', {
        ...data,
        toEmployeeId: parseInt(data.toEmployeeId),
        isAnonymous: false, // Always not anonymous
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Compliment Verstuurd!",
        description: "Je compliment is succesvol bezorgd.",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Het versturen van het compliment is mislukt. Probeer opnieuw.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ComplimentFormData) => {
    setIsSubmitting(true);
    try {
      await sendComplimentMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent" />
            Compliment Versturen
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aan:</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een collega" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Je bericht:</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deel wat je waardeert aan deze persoon..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            

            
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-accent text-white hover:bg-yellow-600"
              >
                {isSubmitting ? (
                  "Versturen..."
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Compliment Versturen
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
