import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Bell, Users, Clock, Trophy, Images, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import MediaGrid from "@/components/media-grid";
import EmployeeTable from "@/components/employee-table";
import { ComplimentModal } from "@/components/compliment-modal";
import { EmployeeImportModal } from "@/components/employee-import-modal";
import { MediaUploadModal } from "@/components/media-upload-modal";
import { TemplateModal } from "@/components/template-modal";
import TemplateBuilder from "@/components/template-builder";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import ReferralManagement from "@/components/referral-management";
// import { LanguageSelector } from "@/components/language-selector";
// import { useLanguage } from "@/lib/i18n";

export default function HRDashboard() {
  const { user, logout } = useAuth();
  const [showComplimentModal, setShowComplimentModal] = useState(false);
  const [showEmployeeImportModal, setShowEmployeeImportModal] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  // const { t } = useLanguage();
  
  // Temporary translation function for testing
  const t = (key: string) => {
    const translations: { [key: string]: string } = {
      'dashboard.title': 'HR Dashboard',
      'dashboard.quickActions': 'Snelle Acties',
      'dashboard.recentActivity': 'Recente Activiteit',
      'actions.addEmployee': 'Werknemer Toevoegen',
      'actions.uploadMedia': 'Media Uploaden',
      'actions.createTemplate': 'Sjabloon Maken',
      'actions.sendCompliment': 'Compliment Versturen',
      'nav.employees': 'Werknemers',
      'nav.media': 'Media Bibliotheek',
      'nav.templates': 'Sjablonen',
      'nav.referrals': 'Referrals',
      'nav.analytics': 'Analyses',
      'dashboard.stats.totalEmployees': 'Totaal Werknemers',
      'dashboard.stats.activeTimelines': 'Actieve Tijdlijnen',
      'dashboard.stats.complimentsSent': 'Complimenten Verstuurd',
      'dashboard.stats.mediaItems': 'Media Items'
    };
    return translations[key] || key;
  };
  
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

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

  const { data: activities } = useQuery({
    queryKey: ['/api/dashboard/activities'],
    queryFn: async () => {
      // Mock activity data for now
      return [
        {
          id: 1,
          type: 'compliment',
          from: 'Sarah Johnson',
          to: 'Mike Chen',
          time: '2 hours ago',
          icon: <Heart className="w-4 h-4" />,
          color: 'bg-secondary'
        },
        {
          id: 2,
          type: 'photo',
          employee: 'Emma Wilson',
          time: '4 hours ago',
          icon: <Images className="w-4 h-4" />,
          color: 'bg-primary'
        },
        {
          id: 3,
          type: 'birthday',
          employee: 'David Rodriguez',
          time: '1 day ago',
          icon: <Trophy className="w-4 h-4" />,
          color: 'bg-accent'
        }
      ];
    },
  });

  const statsCards = [
    {
      title: t('dashboard.stats.totalEmployees'),
      value: stats?.totalEmployees || 0,
      change: "+8% from last month",
      icon: <Users className="w-5 h-5" />,
      color: "bg-primary"
    },
    {
      title: t('dashboard.stats.activeTimelines'),
      value: stats?.activeTimelines || 0,
      change: "74% engagement rate",
      icon: <Clock className="w-5 h-5" />,
      color: "bg-secondary"
    },
    {
      title: t('dashboard.stats.complimentsSent'),
      value: stats?.complimentsSent || 0,
      change: "+23% this week",
      icon: <Heart className="w-5 h-5" />,
      color: "bg-accent"
    },
    {
      title: t('dashboard.stats.mediaItems'),
      value: stats?.mediaItems || 0,
      change: "+15 today",
      icon: <Images className="w-5 h-5" />,
      color: "bg-purple-600"
    }
  ];

  const quickActions = [
    {
      title: t('actions.addEmployee'),
      icon: <Plus className="w-6 h-6" />,
      color: "bg-primary hover:bg-blue-700",
      action: () => setShowEmployeeImportModal(true)
    },
    {
      title: t('actions.uploadMedia'),
      icon: <Images className="w-6 h-6" />,
      color: "bg-secondary hover:bg-green-600",
      action: () => setShowMediaUpload(true)
    },
    {
      title: "Sjabloon Maken (Binnenkort)",
      icon: <Plus className="w-6 h-6" />,
      color: "bg-gray-400 cursor-not-allowed",
      action: () => {
        // Coming soon - disabled for now
      }
    },
    {
      title: t('actions.sendCompliment'),
      icon: <Heart className="w-6 h-6" />,
      color: "bg-purple-600 hover:bg-purple-700",
      action: () => setShowComplimentModal(true)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center mr-8">
                <Heart className="text-primary text-2xl mr-2" />
                <span className="text-xl font-bold text-gray-900">WorkMoments</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* <LanguageSelector /> */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-gray-700 text-sm font-medium">{user?.name || 'User'}</span>
                <Button variant="ghost" size="icon" onClick={logout} title="Uitloggen">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">{t('nav.dashboard')}</TabsTrigger>
            <TabsTrigger value="media">{t('nav.media')}</TabsTrigger>
            <TabsTrigger value="employees">{t('nav.employees')}</TabsTrigger>
            <TabsTrigger value="templates">{t('nav.templates')}</TabsTrigger>
            <TabsTrigger value="referrals">{t('nav.referrals')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('nav.analytics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your team.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`${stat.color} bg-opacity-10 p-3 rounded-full`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-secondary">{stat.change}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                  <Button variant="link" size="sm">{t('dashboard.viewAll')}</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities?.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {activity.type === 'compliment' ? (
                              <>
                                <span className="font-medium">{activity.from}</span> sent a compliment to{" "}
                                <span className="font-medium">{activity.to}</span>
                              </>
                            ) : activity.type === 'photo' ? (
                              <>
                                New photo added to <span className="font-medium">{activity.employee}'s</span> timeline
                              </>
                            ) : (
                              <>
                                Birthday trigger activated for <span className="font-medium">{activity.employee}</span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        onClick={action.action}
                        className={`${action.color} p-4 h-auto flex flex-col items-center space-y-2`}
                      >
                        {action.icon}
                        <span className="text-sm font-medium">{action.title}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <MediaGrid />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeTable />
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sjablonen - Binnenkort Beschikbaar</h3>
                <p className="text-gray-600 mb-4">
                  We werken hard aan een geavanceerd sjabloon systeem voor automatische content delivery.
                </p>
                <p className="text-sm text-gray-500">
                  Deze functie wordt binnenkort gelanceerd met drag-and-drop editor en automatische triggers.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <ComplimentModal 
        isOpen={showComplimentModal} 
        onClose={() => setShowComplimentModal(false)}
        employees={employees}
      />
      
      <EmployeeImportModal
        isOpen={showEmployeeImportModal}
        onClose={() => setShowEmployeeImportModal(false)}
      />
      
      <MediaUploadModal
        isOpen={showMediaUpload}
        onClose={() => setShowMediaUpload(false)}
      />
      
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />
    </div>
  );
}
