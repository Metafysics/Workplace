import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, Euro, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface JobOpening {
  id: number;
  title: string;
  department: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange: string;
  bonusAmount: number;
  isActive: boolean;
  createdAt: string;
  companyId: number;
}

interface Referral {
  id: number;
  jobId: number;
  referrerId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  resume: string;
  status: string;
  bonusAmount: number;
  notes: string;
  createdAt: string;
  jobTitle: string;
  referrerName: string;
}

export default function ReferralManagement() {
  const { toast } = useToast();
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [selectedJobForReferrals, setSelectedJobForReferrals] = useState<number | null>(null);
  
  // Job form state
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    bonusAmount: 0,
    isActive: true
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch job openings
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  // Fetch all referrals for the company
  const { data: allReferrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['/api/referrals'],
    queryFn: async () => {
      const response = await fetch('/api/referrals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch referrals');
      return response.json();
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async ({ jobData, file }: { jobData: any; file?: File }) => {
      if (file) {
        // Handle file upload
        const formData = new FormData();
        Object.keys(jobData).forEach(key => {
          formData.append(key, jobData[key]);
        });
        formData.append('file', file);
        
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch('/api/jobs/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`
          },
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload job with file');
        }
        return response.json();
      } else {
        return apiRequest('POST', '/api/jobs', jobData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      setShowJobModal(false);
      resetJobForm();
      toast({
        title: "Vacature Toegevoegd",
        description: "De vacature is succesvol toegevoegd",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het toevoegen van de vacature",
        variant: "destructive",
      });
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, ...jobData }: any) => {
      return apiRequest('PUT', `/api/jobs/${id}`, jobData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      setShowJobModal(false);
      setEditingJob(null);
      resetJobForm();
      toast({
        title: "Vacature Bijgewerkt",
        description: "De vacature is succesvol bijgewerkt",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het bijwerken van de vacature",
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return apiRequest('DELETE', `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Vacature Verwijderd",
        description: "De vacature is succesvol verwijderd",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het verwijderen van de vacature",
        variant: "destructive",
      });
    },
  });

  // Update referral status mutation
  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, status, bonusAmount }: { id: number; status: string; bonusAmount?: number }) => {
      return apiRequest('PUT', `/api/referrals/${id}/status`, { status, bonusAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      toast({
        title: "Referral Status Bijgewerkt",
        description: "De referral status is succesvol bijgewerkt",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het bijwerken van de referral status",
        variant: "destructive",
      });
    },
  });

  const resetJobForm = () => {
    setJobForm({
      title: '',
      department: '',
      description: '',
      requirements: '',
      location: '',
      salaryRange: '',
      bonusAmount: 0,
      isActive: true
    });
    setSelectedFile(null);
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    resetJobForm();
    setShowJobModal(true);
  };

  const handleEditJob = (job: JobOpening) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      department: job.department,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      salaryRange: job.salaryRange,
      bonusAmount: job.bonusAmount,
      isActive: job.isActive
    });
    setShowJobModal(true);
  };

  const handleSubmitJob = () => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, ...jobForm });
    } else {
      createJobMutation.mutate({ jobData: jobForm, file: selectedFile || undefined });
    }
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Weet je zeker dat je deze vacature wilt verwijderen?')) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const handleStatusChange = (referralId: number, newStatus: string, bonusAmount?: number) => {
    updateReferralMutation.mutate({
      id: referralId,
      status: newStatus,
      bonusAmount: bonusAmount
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Afwachting</Badge>;
      case 'reviewing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Behandeling</Badge>;
      case 'interviewed':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Geïnterviewd</Badge>;
      case 'hired':
        return <Badge variant="default" className="bg-green-500">Aangenomen</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Afgewezen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReferrals = selectedJobForReferrals 
    ? allReferrals.filter((ref: Referral) => ref.jobId === selectedJobForReferrals)
    : allReferrals;

  if (jobsLoading || referralsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Referral Programma</h2>
          <p className="text-gray-600">Beheer vacatures en volg referrals van werknemers</p>
        </div>
        <Button onClick={handleCreateJob}>
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Vacature
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Actieve Vacatures</p>
                <p className="text-xl font-bold">{jobs.filter((job: JobOpening) => job.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Totale Referrals</p>
                <p className="text-xl font-bold">{allReferrals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Goedgekeurd</p>
                <p className="text-xl font-bold">{allReferrals.filter((ref: Referral) => ref.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Totale Bonussen</p>
                <p className="text-xl font-bold">€{allReferrals.filter((ref: Referral) => ref.status === 'approved').reduce((sum: number, ref: Referral) => sum + ref.bonusAmount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Openings */}
      <Card>
        <CardHeader>
          <CardTitle>Vacatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job: JobOpening) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{job.title}</h3>
                      <Badge variant={job.isActive ? "default" : "secondary"}>
                        {job.isActive ? "Actief" : "Inactief"}
                      </Badge>
                      <Badge variant="outline">€{job.bonusAmount} bonus</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{job.department} • {job.location}</p>
                    <p className="text-sm text-gray-500">{job.description}</p>
                    <p className="text-sm text-blue-600 mt-2">
                      {allReferrals.filter((ref: Referral) => ref.jobId === job.id).length} referrals
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedJobForReferrals(selectedJobForReferrals === job.id ? null : job.id)}
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditJob(job)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteJob(job.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Referrals 
            {selectedJobForReferrals && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                voor {jobs.find((job: JobOpening) => job.id === selectedJobForReferrals)?.title}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kandidaat</TableHead>
                <TableHead>Vacature</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.map((referral: Referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{referral.candidateName}</p>
                      <p className="text-sm text-gray-600">{referral.candidateEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{referral.jobTitle}</TableCell>
                  <TableCell>{referral.referrerName}</TableCell>
                  <TableCell>{getStatusBadge(referral.status)}</TableCell>
                  <TableCell>€{referral.bonusAmount}</TableCell>
                  <TableCell>{new Date(referral.createdAt).toLocaleDateString('nl-NL')}</TableCell>
                  <TableCell>
                    <Select 
                      value={referral.status} 
                      onValueChange={(newStatus) => handleStatusChange(referral.id, newStatus, referral.bonusAmount)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">In Afwachting</SelectItem>
                        <SelectItem value="reviewing">In Behandeling</SelectItem>
                        <SelectItem value="interviewed">Geïnterviewd</SelectItem>
                        <SelectItem value="hired">Aangenomen</SelectItem>
                        <SelectItem value="rejected">Afgewezen</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job Modal */}
      <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Vacature Bewerken' : 'Nieuwe Vacature'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <Input
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="Functietitel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Afdeling</label>
                <Input
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  placeholder="Afdeling"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Locatie</label>
                <Input
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  placeholder="Werklocatie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Salaris Range</label>
                <Input
                  value={jobForm.salaryRange}
                  onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                  placeholder="€40.000 - €60.000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Referral Bonus (€)</label>
              <Input
                type="number"
                value={jobForm.bonusAmount}
                onChange={(e) => setJobForm({ ...jobForm, bonusAmount: parseInt(e.target.value) || 0 })}
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Beschrijving</label>
              <Textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="Functieomschrijving..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vereisten</label>
              <Textarea
                value={jobForm.requirements}
                onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                placeholder="Functie-eisen..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Vacature PDF (optioneel)</label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Geselecteerd: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowJobModal(false)}>
                Annuleren
              </Button>
              <Button onClick={handleSubmitJob}>
                {editingJob ? 'Bijwerken' : 'Toevoegen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}