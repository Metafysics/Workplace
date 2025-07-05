import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Users, AlertCircle, CheckCircle, FileText, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const singleEmployeeSchema = z.object({
  name: z.string().min(2, "Naam is verplicht"),
  email: z.string().email("Geldig e-mailadres is verplicht"),
  phoneNumber: z.string().optional(),
  department: z.string().min(1, "Afdeling is verplicht"),
  position: z.string().optional(),
  manager: z.string().optional(),
  employeeNumber: z.string().optional(),
  address: z.string().optional(),
  birthday: z.string().optional(),
  hireDate: z.string().optional(),
});

type SingleEmployeeData = z.infer<typeof singleEmployeeSchema>;

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

export function EmployeeImportModal({ isOpen, onClose }: EmployeeImportModalProps) {
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('single');
  const [csvData, setCsvData] = useState<string>('');
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const queryClient = useQueryClient();

  const form = useForm<SingleEmployeeData>({
    resolver: zodResolver(singleEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      department: "",
      position: "",
      manager: "",
      employeeNumber: "",
      address: "",
      birthday: "",
      hireDate: "",
    },
  });

  // Single employee creation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: SingleEmployeeData) => {
      const employeeData = {
        ...data,
        birthday: data.birthday ? new Date(data.birthday).toISOString() : null,
        hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : null,
      };
      
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(employeeData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create employee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      form.reset();
      onClose();
    },
  });

  // Bulk employee import
  const bulkImportMutation = useMutation({
    mutationFn: async (employees: any[]): Promise<ImportResult> => {
      const response = await fetch("/api/employees/bulk-import", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ employees }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to import employees');
      }
      
      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setImportResults(result);
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const employees = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        errors.push({ row: i + 1, error: 'Aantal kolommen komt niet overeen met headers' });
        continue;
      }

      const employee: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        
        switch (header) {
          case 'name':
          case 'naam':
            employee.name = value;
            break;
          case 'email':
          case 'e-mail':
            employee.email = value;
            break;
          case 'phone':
          case 'phonenumber':
          case 'phone_number':
          case 'telefoon':
          case 'gsm':
            employee.phoneNumber = value;
            break;
          case 'department':
          case 'afdeling':
            employee.department = value;
            break;
          case 'position':
          case 'functie':
          case 'job_title':
            employee.position = value;
            break;
          case 'manager':
          case 'leidinggevende':
          case 'supervisor':
            employee.manager = value;
            break;
          case 'employee_number':
          case 'employeenumber':
          case 'personeelsnummer':
            employee.employeeNumber = value;
            break;
          case 'address':
          case 'adres':
            employee.address = value;
            break;
          case 'emergency_contact':
          case 'emergencycontact':
          case 'noodcontact':
            employee.emergencyContact = value;
            break;
          case 'emergency_phone':
          case 'emergencyphone':
          case 'noodtelefoon':
            employee.emergencyPhone = value;
            break;
          case 'birthday':
          case 'geboortedatum':
            if (value && value !== '') {
              employee.birthday = new Date(value).toISOString();
            }
            break;
          case 'hiredate':
          case 'hire_date':
          case 'aangenomen':
          case 'startdatum':
            if (value && value !== '') {
              employee.hireDate = new Date(value).toISOString();
            }
            break;
        }
      });

      // Validate required fields
      if (!employee.name || !employee.email || !employee.department) {
        errors.push({ 
          row: i + 1, 
          error: 'Verplichte velden (naam, email, afdeling) ontbreken',
          data: employee 
        });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employee.email)) {
        errors.push({ 
          row: i + 1, 
          error: 'Ongeldig e-mailadres',
          data: employee 
        });
        continue;
      }

      employees.push(employee);
    }

    return { employees, errors };
  };

  const handleBulkImport = () => {
    if (!csvData.trim()) return;

    setIsProcessing(true);
    setUploadProgress(0);

    const { employees, errors } = parseCsvData(csvData);

    if (errors.length > 0 && employees.length === 0) {
      setImportResults({
        success: false,
        total: 0,
        imported: 0,
        errors: errors,
      });
      setIsProcessing(false);
      return;
    }

    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    bulkImportMutation.mutate(employees);
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,phone_number,department,position,manager,employee_number,address,birthday,hireDate\nJohn Doe,john@example.com,+32 123 456 789,IT,Software Developer,Jane Smith,EMP001,Brusselsestraat 123 Antwerpen,1990-01-15,2023-03-01\nJane Smith,jane@example.com,+32 456 789 123,HR,HR Manager,Tom Johnson,EMP002,Turnhoutsebaan 456 Mechelen,1985-05-20,2022-01-15';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const onSubmit = (data: SingleEmployeeData) => {
    createEmployeeMutation.mutate(data);
  };

  const resetForm = () => {
    setImportMode('single');
    setCsvData('');
    setImportResults(null);
    setIsProcessing(false);
    setUploadProgress(0);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Werknemers Toevoegen</span>
          </DialogTitle>
          <DialogDescription>
            Voeg één werknemer handmatig toe of upload een CSV/Excel bestand voor bulk import
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selection */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={importMode === 'single' ? 'default' : 'outline'}
            onClick={() => setImportMode('single')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Handmatig Toevoegen
          </Button>
          <Button
            variant={importMode === 'bulk' ? 'default' : 'outline'}
            onClick={() => setImportMode('bulk')}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import (CSV/Excel)
          </Button>
        </div>

        {importMode === 'single' ? (
          /* Single Employee Form */
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Telefoonnummer / GSM</Label>
                <Input
                  id="phoneNumber"
                  {...form.register("phoneNumber")}
                  placeholder="+32 123 456 789"
                />
              </div>
              
              <div>
                <Label htmlFor="department">Afdeling *</Label>
                <Input
                  id="department"
                  {...form.register("department")}
                  placeholder="IT"
                />
                {form.formState.errors.department && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.department.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="position">Functie / Positie</Label>
                <Input
                  id="position"
                  {...form.register("position")}
                  placeholder="Software Developer"
                />
              </div>
              
              <div>
                <Label htmlFor="manager">Leidinggevende</Label>
                <Input
                  id="manager"
                  {...form.register("manager")}
                  placeholder="Jane Smith"
                />
              </div>
              
              <div>
                <Label htmlFor="employeeNumber">Personeelsnummer</Label>
                <Input
                  id="employeeNumber"
                  {...form.register("employeeNumber")}
                  placeholder="EMP001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  placeholder="Brusselsestraat 123, 2000 Antwerpen"
                />
              </div>
            </div>


            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <Label htmlFor="birthday">Geboortedatum</Label>
                <Input
                  id="birthday"
                  type="date"
                  {...form.register("birthday")}
                />
              </div>
              
              <div>
                <Label htmlFor="hireDate">Startdatum</Label>
                <Input
                  id="hireDate"
                  type="date"
                  {...form.register("hireDate")}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={createEmployeeMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createEmployeeMutation.isPending ? "Toevoegen..." : "Werknemer Toevoegen"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
            </div>
          </form>
        ) : (
          /* Bulk Import Section */
          <div className="space-y-6">
            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Stap 1: Download Template</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Download de CSV template met de juiste kolommen en voorbeelddata
                </p>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Template Downloaden
                </Button>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Stap 2: Bestand Uploaden</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csvFile">CSV/Excel bestand selecteren</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Vereiste kolommen:</strong></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary">name</Badge>
                      <Badge variant="secondary">email</Badge>
                      <Badge variant="secondary">department</Badge>
                      <Badge variant="outline">birthday (optioneel)</Badge>
                      <Badge variant="outline">hireDate (optioneel)</Badge>
                    </div>
                  </div>

                  {csvData && (
                    <div>
                      <Label>Preview van geüploade data:</Label>
                      <Textarea
                        value={csvData.slice(0, 500) + (csvData.length > 500 ? '...' : '')}
                        readOnly
                        className="mt-1 h-24 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Import Progress */}
            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Werknemers importeren...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import Results */}
            {importResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    {importResults.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>Import Resultaten</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{importResults.total}</p>
                        <p className="text-sm text-gray-600">Totaal Rijen</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{importResults.imported}</p>
                        <p className="text-sm text-gray-600">Geïmporteerd</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{importResults.errors.length}</p>
                        <p className="text-sm text-gray-600">Fouten</p>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Fouten:</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, index) => (
                            <Alert key={index} variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Rij {error.row}:</strong> {error.error}
                                {error.data && (
                                  <div className="text-xs mt-1 opacity-75">
                                    Data: {JSON.stringify(error.data)}
                                  </div>
                                )}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleBulkImport}
                disabled={!csvData.trim() || isProcessing || bulkImportMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {isProcessing ? "Importeren..." : "Import Starten"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Sluiten
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}