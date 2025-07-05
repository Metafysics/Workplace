import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Upload, TrendingUp, UserPlus, Eye, Euro } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/analytics/company/${user?.companyId}`],
    enabled: !!user?.companyId,
  });

  // Fetch referrals data for detailed analytics
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["/api/referrals"],
    enabled: !!user?.companyId,
  });

  if (isLoading || analyticsLoading || referralsLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  const dashboardStats = stats || {
    totalEmployees: 0,
    activeTimelines: 0,
    complimentsSent: 0,
    mediaItems: 0,
  };

  // Process referrals data first
  const referralsData = referrals || [];
  const pendingReferrals = referralsData.filter((r: any) => r.status === 'pending').length;
  const reviewingReferrals = referralsData.filter((r: any) => r.status === 'reviewing').length;
  const interviewedReferrals = referralsData.filter((r: any) => r.status === 'interviewed').length;
  const hiredReferrals = referralsData.filter((r: any) => r.status === 'hired').length;
  const rejectedReferrals = referralsData.filter((r: any) => r.status === 'rejected').length;

  // Process analytics data
  const analyticsData = analytics || [];
  const referralCount = analyticsData.filter((item: any) => item.actionType === 'referral_submitted').length;
  const mediaViewCount = analyticsData.filter((item: any) => item.actionType === 'media_viewed').length;
  
  // Calculate additional metrics
  const totalReferrals = referralsData.length;
  const totalBonusPaid = referralsData
    .filter((r: any) => r.status === 'hired' && r.bonusPaid)
    .reduce((sum: number, r: any) => sum + (r.bonusAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-gray-600">Overview of platform engagement and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Werknemers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Tijdlijnen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeTimelines}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complimenten Verstuurd</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.complimentsSent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Items</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.mediaItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doorverwijzingen</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralCount}</div>
            <p className="text-xs text-muted-foreground">Totaal ingediend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Bekeken</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaViewCount}</div>
            <p className="text-xs text-muted-foreground">Aantal keer bekeken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonus Uitbetaald</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalBonusPaid.toLocaleString('nl-NL')}</div>
            <p className="text-xs text-muted-foreground">Totaal uitbetaald</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Status Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Status Overzicht</CardTitle>
          <p className="text-sm text-gray-600">Voortgang van alle doorverwijzingen</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingReferrals}</div>
              <p className="text-xs text-muted-foreground">In afwachting</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reviewingReferrals}</div>
              <p className="text-xs text-muted-foreground">In behandeling</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{interviewedReferrals}</div>
              <p className="text-xs text-muted-foreground">Geïnterviewd</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{hiredReferrals}</div>
              <p className="text-xs text-muted-foreground">Aangenomen</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedReferrals}</div>
              <p className="text-xs text-muted-foreground">Afgewezen</p>
            </div>
          </div>
          
          {referralsData.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Succespercentage:</span>
                <span className="font-semibold text-green-600">
                  {Math.round((hiredReferrals / referralsData.length) * 100)}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Engagement Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Betrokkenheid</CardTitle>
          <p className="text-sm text-gray-600">Overzicht van werknemersactiviteit en engagement</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{Math.round((mediaViewCount / Math.max(dashboardStats.totalEmployees, 1)) * 100)}%</div>
              <p className="text-xs text-blue-600">Media engagement rate</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{Math.round((referralCount / Math.max(dashboardStats.totalEmployees, 1)) * 100)}%</div>
              <p className="text-xs text-green-600">Referral participation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Activiteit</CardTitle>
          <p className="text-sm text-gray-600">Laatste doorverwijzingen en media interacties</p>
        </CardHeader>
        <CardContent>
          {analyticsData.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    {item.actionType === 'referral_submitted' ? (
                      <UserPlus className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm">
                      {item.actionType === 'referral_submitted' 
                        ? 'Nieuwe doorverwijzing ingediend' 
                        : 'Media bekeken'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.analytics?.createdAt || Date.now()).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nog geen activiteit gevonden
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}