import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, Users, Eye, Play, FileText, Calendar, Trophy, Heart, Gift, Briefcase, Star, Share2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const sendMediaSchema = z.object({
  employeeIds: z.array(z.number()).min(1, "Selecteer minimaal één werknemer"),
  message: z.string().optional(),
  category: z.string().min(1, "Selecteer een categorie"),
});

type SendMediaFormData = z.infer<typeof sendMediaSchema>;

interface MediaSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: any;
}

export function MediaSendModal({ isOpen, onClose, mediaItem }: MediaSendModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SendMediaFormData>({
    resolver: zodResolver(sendMediaSchema),
    defaultValues: {
      employeeIds: [],
      message: "",
      category: "",
    },
  });

  // Define timeline categories
  const timelineCategories = [
    { value: 'event', label: 'Event', icon: Calendar, color: 'bg-blue-100 text-blue-800' },
    { value: 'achievement', label: 'Prestatie', icon: Trophy, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'birthday', label: 'Verjaardag', icon: Gift, color: 'bg-pink-100 text-pink-800' },
    { value: 'work_anniversary', label: 'Dienstjubileum', icon: Star, color: 'bg-purple-100 text-purple-800' },
    { value: 'team_update', label: 'Team Update', icon: Users, color: 'bg-green-100 text-green-800' },
    { value: 'announcement', label: 'Aankondiging', icon: Briefcase, color: 'bg-orange-100 text-orange-800' },
    { value: 'media_shared', label: 'Media Gedeeld', icon: Share2, color: 'bg-indigo-100 text-indigo-800' },
  ];

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  // Filter and sort employees
  const filteredAndSortedEmployees = employees
    .filter((emp: any) => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a: any, b: any) => a.name.localeCompare(b.name, 'nl'));

  const sendMediaMutation = useMutation({
    mutationFn: async (data: SendMediaFormData) => {
      const response = await apiRequest('POST', '/api/timeline-items', {
        mediaItemId: mediaItem.id,
        employeeIds: data.employeeIds,
        message: data.message || `Nieuwe media: ${mediaItem.title}`,
        type: data.category
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Media Verstuurd!",
        description: `${mediaItem.title} is verstuurd naar de geselecteerde werknemers.`,
      });
      form.reset();
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/timeline-items'] });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Het versturen van de media is mislukt. Probeer opnieuw.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SendMediaFormData) => {
    setIsSubmitting(true);
    try {
      await sendMediaMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      form.setValue('employeeIds', filteredAndSortedEmployees.map((emp: any) => emp.id));
    } else {
      form.setValue('employeeIds', []);
    }
  };

  const handleEmployeeToggle = (employeeId: number, checked: boolean) => {
    const currentIds = form.getValues('employeeIds');
    if (checked) {
      form.setValue('employeeIds', [...currentIds, employeeId]);
    } else {
      form.setValue('employeeIds', currentIds.filter(id => id !== employeeId));
      setSelectAll(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <Eye className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-green-100 text-green-800';
      case 'document': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!mediaItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Media Versturen naar Werknemers
          </DialogTitle>
        </DialogHeader>

        {/* Media Preview */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {getMediaIcon(mediaItem.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{mediaItem.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{mediaItem.description}</p>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(mediaItem.type)}>
                    {mediaItem.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(mediaItem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een categorie voor deze media" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timelineCategories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bericht (optioneel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Voeg een persoonlijk bericht toe..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecteer Werknemers</FormLabel>
                  
                  {/* Search Field */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Zoek werknemers op naam, afdeling of functie..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Select All */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Iedereen selecteren ({filteredAndSortedEmployees.length} van {employees.length} werknemers)
                    </label>
                  </div>

                  {/* Employee List */}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredAndSortedEmployees.length > 0 ? 
                      filteredAndSortedEmployees.map((employee: any) => (
                        <div
                          key={employee.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            id={`employee-${employee.id}`}
                            checked={field.value.includes(employee.id)}
                            onCheckedChange={(checked) => 
                              handleEmployeeToggle(employee.id, checked as boolean)
                            }
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {employee.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <label 
                              htmlFor={`employee-${employee.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {employee.name}
                            </label>
                            <div className="text-xs text-gray-500">
                              {employee.department} • {employee.position || 'Werknemer'}
                            </div>
                          </div>
                        </div>
                      )) 
                      : 
                      (
                        <div className="text-center py-8 text-gray-500">
                          Geen werknemers gevonden voor "{searchTerm}"
                        </div>
                      )
                    }
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-500">
                {form.watch('employeeIds').length} van {filteredAndSortedEmployees.length} werknemers geselecteerd
              </div>
              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || form.watch('employeeIds').length === 0}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    "Versturen..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Media Versturen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}