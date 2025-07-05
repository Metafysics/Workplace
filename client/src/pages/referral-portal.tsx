import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Users, Briefcase, Euro, Trophy, Send, FileText, Phone, Linkedin, Mail, MapPin, Clock, CheckCircle, XCircle, ArrowLeft, Gift } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const referralFormSchema = z.object({
  candidateName: z.string().min(1, "Naam is verplicht"),
  candidateEmail: z.string().email("Geldig e-mailadres is verplicht"),
  candidatePhone: z.string().optional(),
  candidateLinkedin: z.string().optional(),
  personalNote: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralFormSchema>;

interface ReferralPortalProps {
  employeeId: number;
  companyId: number;
  onBack?: () => void;
}

export default function ReferralPortal({ employeeId, companyId, onBack }: ReferralPortalProps) {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      candidateLinkedin: "",
      personalNote: "",
    },
  });

  // Fetch active job openings
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: [`/api/jobs/public/${companyId}`],
    enabled: !!companyId,
  });

  // Fetch employee data to get NFC token for navigation
  const { data: employeeData } = useQuery({
    queryKey: [`/api/employees`],
  });

  // Function to navigate back to employee profile
  const handleBackToProfile = () => {
    if (employeeData) {
      const currentEmployee = employeeData.find((emp: any) => emp.id === employeeId);
      if (currentEmployee?.nfcToken) {
        setLocation(`/profile/${currentEmployee.nfcToken}`);
        return;
      }
    }
    // Fallback to history.back() if we can't find the NFC token
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Fetch referral settings
  const { data: settings } = useQuery({
    queryKey: [`/api/referral-settings/public/${companyId}`],
    enabled: !!companyId,
  });

  // Fetch employee's referrals
  const { data: myReferrals = [] } = useQuery({
    queryKey: [`/api/referrals/employee/${employeeId}`],
    enabled: !!employeeId,
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: async (data: ReferralFormData & { jobId: number }) => {
      // Find the selected job to get the correct bonus amount
      const selectedJob = jobs?.find((job: any) => job.id === data.jobId);
      const jobBonusAmount = selectedJob?.bonusAmount || 0;
      
      const payload = {
        ...data,
        referredBy: employeeId,
        companyId: companyId,
        bonusAmount: jobBonusAmount,
      };
      console.log("Sending referral data:", payload);
      const response = await apiRequest("POST", "/api/referrals", payload);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Referral created successfully:", data);
      toast({
        title: "Referral succesvol verstuurd!",
        description: "Je kandidaat doorverwijzing is ontvangen en wordt beoordeeld.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/referrals/employee/${employeeId}`] });
      form.reset();
      setSelectedJobId(null);
    },
    onError: (error) => {
      console.error("Referral creation failed:", error);
      toast({
        title: "Fout bij versturen",
        description: "Er ging iets mis bij het versturen van je doorverwijzing. Probeer het opnieuw.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReferralFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Selected job ID:", selectedJobId);
    if (!selectedJobId) {
      console.error("No job selected!");
      return;
    }
    console.log("Calling mutation...");
    createReferralMutation.mutate({ ...data, jobId: selectedJobId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const totalEarned = myReferrals
    .filter((r: any) => r.bonusPaid)
    .reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);

  const pendingEarnings = myReferrals
    .filter((r: any) => r.status === 'hired' && !r.bonusPaid)
    .reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary bg-opacity-10 p-3 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Referral Programma</h1>
                <p className="text-gray-600">Verwijs vrienden en collega's en verdien bonussen</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleBackToProfile}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Terug naar profiel</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">€{totalEarned}</p>
              <p className="text-sm text-gray-600">Totaal verdiend</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-yellow-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">€{pendingEarnings}</p>
              <p className="text-sm text-gray-600">In behandeling</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{myReferrals.length}</p>
              <p className="text-sm text-gray-600">Totaal referrals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {myReferrals.filter((r: any) => r.status === 'hired').length}
              </p>
              <p className="text-sm text-gray-600">Succesvol</p>
            </CardContent>
          </Card>
        </div>

        {/* Program Info */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Programma Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Euro className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Bonus bij aanname</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">€{settings.bonusAmount}</p>
                </div>
                
                {settings.bonusOnInterview && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Interview bonus</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">€{settings.interviewBonusAmount}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Voorwaarden</h4>
                <p className="text-sm text-gray-600">{settings.termsAndConditions}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Beschikbare Vacatures</span>
            </CardTitle>
            <CardDescription>
              Kies een vacature om een kandidaat voor te dragen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <p>Vacatures laden...</p>
            ) : jobs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen actieve vacatures beschikbaar.</p>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job: any) => (
                  <div
                    key={job.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedJobId === job.id ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <Badge variant="secondary">{job.department}</Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.salaryRange && (
                        <div className="flex items-center space-x-1">
                          <Euro className="w-4 h-4" />
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                      {job.bonusAmount && job.bonusAmount > 0 && (
                        <div className="flex items-center space-x-1 text-green-600 font-medium">
                          <Gift className="w-4 h-4" />
                          <span>€{job.bonusAmount} bonus</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                    
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Vereisten:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.requirements.slice(0, 3).map((req: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {job.requirements.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requirements.length - 3} meer
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Form */}
        {selectedJobId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Kandidaat Doorverwijzen</span>
              </CardTitle>
              <CardDescription>
                Vul de gegevens van je kandidaat in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="candidateName">Volledige naam *</Label>
                    <Input
                      id="candidateName"
                      {...form.register("candidateName")}
                      placeholder="John Doe"
                    />
                    {form.formState.errors.candidateName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.candidateName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="candidateEmail">E-mailadres *</Label>
                    <Input
                      id="candidateEmail"
                      type="email"
                      {...form.register("candidateEmail")}
                      placeholder="john@example.com"
                    />
                    {form.formState.errors.candidateEmail && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.candidateEmail.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="candidatePhone">Telefoonnummer (optioneel)</Label>
                    <Input
                      id="candidatePhone"
                      {...form.register("candidatePhone")}
                      placeholder="+31 6 12345678"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="candidateLinkedin">LinkedIn profiel (optioneel)</Label>
                    <Input
                      id="candidateLinkedin"
                      {...form.register("candidateLinkedin")}
                      placeholder="https://linkedin.com/in/johndoe"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="personalNote">Persoonlijke aanbeveling (optioneel)</Label>
                  <Textarea
                    id="personalNote"
                    {...form.register("personalNote")}
                    placeholder="Waarom zou deze kandidaat perfect zijn voor deze rol?"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={createReferralMutation.isPending}
                    className="bg-primary text-white hover:bg-blue-700"
                    onClick={(e) => {
                      console.log("Submit button clicked!");
                      console.log("Form errors:", form.formState.errors);
                      console.log("Form values:", form.getValues());
                      console.log("Selected job:", selectedJobId);
                      console.log("Form valid:", form.formState.isValid);
                      // Don't prevent default, let form handle submission
                    }}
                  >
                    {createReferralMutation.isPending ? "Versturen..." : "Kandidaat doorverwijzen"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedJobId(null);
                      form.reset();
                    }}
                  >
                    Annuleren
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* My Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Mijn Referrals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myReferrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Je hebt nog geen referrals gemaakt.</p>
            ) : (
              <div className="space-y-4">
                {myReferrals.map((referral: any) => (
                  <div key={referral.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{referral.candidateName}</h4>
                        <p className="text-sm text-gray-600">{referral.candidateEmail}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(referral.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(referral.status)}
                            <span>{referral.status}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Doorverwezen op {new Date(referral.createdAt).toLocaleDateString('nl-NL')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Euro className="w-4 h-4 text-gray-400" />
                        <span className={`font-medium ${referral.bonusPaid ? 'text-green-600' : 'text-gray-600'}`}>
                          €{referral.bonusAmount || 0}
                          {referral.bonusPaid && " (betaald)"}
                        </span>
                      </div>
                    </div>
                    
                    {referral.personalNote && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">{referral.personalNote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}