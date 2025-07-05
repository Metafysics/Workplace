import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Edit, Save, X, Calendar, Phone, MapPin, Shield, Bell, Gift } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const updateEmployeeSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phoneNumber: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

type UpdateEmployeeData = z.infer<typeof updateEmployeeSchema>;

export default function EmployeeProfile() {
  const { nfcToken } = useParams();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpdateEmployeeData>({
    resolver: zodResolver(updateEmployeeSchema),
  });

  // Fetch employee data by NFC token
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['/api/employees/nfc', nfcToken],
    enabled: !!nfcToken,
  });

  // Update form when employee data loads
  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name || '',
        email: employee.email || '',
        phoneNumber: employee.phoneNumber || '',
        position: employee.position || '',
        address: employee.address || '',
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
        notes: employee.notes || '',
      });
    }
  }, [employee, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateEmployeeData) => {
      return apiRequest(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Profiel bijgewerkt',
        description: 'Je profiel is succesvol bijgewerkt.',
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/employees/nfc', nfcToken] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het bijwerken van je profiel.',
        variant: 'destructive',
      });
    },
  });

  // Automation mutation
  const updateAutomationMutation = useMutation({
    mutationFn: async (data: { birthdayNotificationsEnabled: boolean; anniversaryNotificationsEnabled: boolean }) => {
      if (!employee?.id) throw new Error('Employee ID niet beschikbaar');
      return apiRequest(`/api/employees/${employee.id}/automation`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Automatische instellingen bijgewerkt',
        description: 'Je automatische notificatie instellingen zijn bijgewerkt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees/nfc', nfcToken] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het bijwerken van automatische instellingen.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UpdateEmployeeData) => {
    updateMutation.mutate(data);
  };

  const handleAutomationToggle = (field: 'birthdayNotificationsEnabled' | 'anniversaryNotificationsEnabled', value: boolean) => {
    if (!employee) return;
    
    const currentSettings = {
      birthdayNotificationsEnabled: employee.birthdayNotificationsEnabled ?? true,
      anniversaryNotificationsEnabled: employee.anniversaryNotificationsEnabled ?? true,
    };
    
    updateAutomationMutation.mutate({
      ...currentSettings,
      [field]: value,
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (employee) {
      form.reset({
        name: employee.name || '',
        email: employee.email || '',
        phoneNumber: employee.phoneNumber || '',
        position: employee.position || '',
        address: employee.address || '',
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
        notes: employee.notes || '',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Profiel laden...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Toegang geweigerd</h2>
            <p className="text-gray-600 mb-4">
              Dit profiel kon niet worden gevonden of je hebt geen toegang.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Terug naar hoofdpagina
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-white text-xl">
                  {employee.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-gray-600">{employee.department}</p>
                {employee.position && (
                  <Badge variant="secondary">{employee.position}</Badge>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Bewerk profiel</span>
                </Button>
              ) : (
                <>
                  <Button onClick={cancelEditing} variant="outline" className="flex items-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Annuleren</span>
                  </Button>
                  <Button 
                    onClick={form.handleSubmit(onSubmit)} 
                    disabled={updateMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Persoonlijke gegevens</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name">Volledige naam *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="John Doe"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-mailadres *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="john@company.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Telefoonnummer</Label>
                    <Input
                      id="phoneNumber"
                      {...form.register("phoneNumber")}
                      placeholder="+32 123 456 789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="position">Functie / Positie</Label>
                    <Input
                      id="position"
                      {...form.register("position")}
                      placeholder="Software Developer"
                    />
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Naam</p>
                      <p className="font-medium">{employee.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">E-mail</p>
                      <p className="font-medium">{employee.email}</p>
                    </div>
                  </div>

                  {employee.phoneNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Telefoon</p>
                        <p className="font-medium">{employee.phoneNumber}</p>
                      </div>
                    </div>
                  )}

                  {employee.position && (
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Functie</p>
                        <p className="font-medium">{employee.position}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Startdatum</p>
                      <p className="font-medium">
                        {employee.hireDate 
                          ? new Date(employee.hireDate).toLocaleDateString('nl-NL')
                          : 'Niet ingevuld'
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Address & Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Adres & Noodcontact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="address">Adres</Label>
                    <Textarea
                      id="address"
                      {...form.register("address")}
                      placeholder="Brusselsestraat 123, 2000 Antwerpen"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Noodcontact</Label>
                    <Input
                      id="emergencyContact"
                      {...form.register("emergencyContact")}
                      placeholder="Marie Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Noodcontact telefoon</Label>
                    <Input
                      id="emergencyPhone"
                      {...form.register("emergencyPhone")}
                      placeholder="+32 987 654 321"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notities</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      placeholder="Extra informatie..."
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  {employee.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Adres</p>
                        <p className="font-medium">{employee.address}</p>
                      </div>
                    </div>
                  )}

                  {employee.emergencyContact && (
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Noodcontact</p>
                        <p className="font-medium">{employee.emergencyContact}</p>
                        {employee.emergencyPhone && (
                          <p className="text-sm text-gray-600">{employee.emergencyPhone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {employee.notes && (
                    <div className="flex items-start space-x-3">
                      <User className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Notities</p>
                        <p className="font-medium">{employee.notes}</p>
                      </div>
                    </div>
                  )}

                  {!employee.address && !employee.emergencyContact && !employee.notes && (
                    <p className="text-gray-500 text-center py-4">
                      Geen aanvullende informatie beschikbaar
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Company Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Bedrijfsinformatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Afdeling</p>
                <p className="font-medium">{employee.department}</p>
              </div>
              {employee.manager && (
                <div>
                  <p className="text-sm text-gray-500">Leidinggevende</p>
                  <p className="font-medium">{employee.manager}</p>
                </div>
              )}
              {employee.employeeNumber && (
                <div>
                  <p className="text-sm text-gray-500">Personeelsnummer</p>
                  <p className="font-medium">{employee.employeeNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Automatische Trigger Instellingen */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Automatische Triggers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Gift className="w-5 h-5 text-purple-500" />
                  <div>
                    <h4 className="text-sm font-medium">Verjaardagsnotificaties</h4>
                    <p className="text-sm text-gray-500">
                      Automatisch verjaardag templates versturen
                    </p>
                  </div>
                </div>
                <Switch
                  checked={employee?.birthdayNotificationsEnabled ?? true}
                  onCheckedChange={(checked) => 
                    handleAutomationToggle('birthdayNotificationsEnabled', checked)
                  }
                  disabled={updateAutomationMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="text-sm font-medium">Jubileumnotificaties</h4>
                    <p className="text-sm text-gray-500">
                      Automatisch jubileum templates versturen
                    </p>
                  </div>
                </div>
                <Switch
                  checked={employee?.anniversaryNotificationsEnabled ?? true}
                  onCheckedChange={(checked) => 
                    handleAutomationToggle('anniversaryNotificationsEnabled', checked)
                  }
                  disabled={updateAutomationMutation.isPending}
                />
              </div>

              {employee?.birthday && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Gift className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Verjaardag ingesteld</p>
                    <p className="text-sm text-purple-600">
                      {new Date(employee.birthday).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {employee?.hireDate && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Dienstverband sinds</p>
                    <p className="text-sm text-blue-600">
                      {new Date(employee.hireDate).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-4">
                <p>Automatische triggers zorgen ervoor dat templates automatisch worden toegevoegd aan medewerkerstijdlijnen op speciale momenten zoals verjaardagen en jubilea.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}