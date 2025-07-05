import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Download, Eye, Edit, RefreshCw, Copy, ExternalLink, QrCode } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeImportModal } from "@/components/employee-import-modal";
import { QRCodeModal } from "@/components/qr-code-modal";
import { Link } from "wouter";

export default function EmployeeTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery({
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

  const regenerateTokenMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const response = await apiRequest('PUT', `/api/employees/${employeeId}/regenerate-token`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Success",
        description: "NFC token regenerated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate token",
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employees.filter((employee: any) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "NFC token copied to clipboard",
    });
  };

  const showQRCode = (employee: any) => {
    setSelectedEmployee(employee);
    setShowQRModal(true);
  };

  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'marketing': return 'bg-blue-100 text-blue-800';
      case 'development': return 'bg-purple-100 text-purple-800';
      case 'hr': return 'bg-green-100 text-green-800';
      case 'sales': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600">Manage employee profiles and NFC access tokens</p>
          </div>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="animate-pulse bg-gray-200 h-96 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage employee profiles and NFC access tokens</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowImportModal(true)}
            className="bg-secondary text-white hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Import Employees
          </Button>
          <Button 
            onClick={() => setShowImportModal(true)}
            className="bg-primary text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>
      
      {/* Employee List */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone / Position</TableHead>
                <TableHead>NFC Token</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Timeline Items</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee: any) => (
                <TableRow key={employee.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-white">
                          {employee.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDepartmentColor(employee.department)}>
                      {employee.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {employee.phoneNumber && (
                        <div className="text-sm text-gray-600 mb-1">
                          📞 {employee.phoneNumber}
                        </div>
                      )}
                      {employee.position && (
                        <div className="text-xs text-gray-500">
                          {employee.position}
                        </div>
                      )}
                      {!employee.phoneNumber && !employee.position && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {employee.nfcToken}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(employee.nfcToken)}
                          className="h-6 w-6"
                          title="Kopieer NFC token"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => showQRCode(employee)}
                          className="h-6 w-6"
                          title="Toon QR code"
                        >
                          <QrCode className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${employee.nfcToken}`}>
                          <span className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer">
                            📱 Profiel pagina
                          </span>
                        </Link>
                        <span className="text-xs text-gray-400">•</span>
                        <button 
                          onClick={() => showQRCode(employee)}
                          className="text-xs text-green-600 hover:text-green-800 underline cursor-pointer"
                        >
                          📋 QR Code
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {employee.lastActive 
                      ? new Date(employee.lastActive).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    0 items
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/profile/${employee.nfcToken}`}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Bekijk profiel">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Bekijk timeline">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Bewerk employee">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => regenerateTokenMutation.mutate(employee.id)}
                        disabled={regenerateTokenMutation.isPending}
                        className="h-6 w-6"
                        title="Regenereer NFC token"
                      >
                        <RefreshCw className={`w-3 h-3 ${regenerateTokenMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {filteredEmployees.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No employees found. Add some employees to get started!</p>
        </div>
      )}
      
      <EmployeeImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {selectedEmployee && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
}
