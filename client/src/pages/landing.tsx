import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Heart, Play, Wifi, Images, Calendar, ChartLine, Bell } from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();

  const features = [
    {
      icon: <Wifi className="w-6 h-6" />,
      title: "NFC Access",
      description: "Instant employee access to personal timelines through NFC tags - no passwords needed.",
      color: "bg-primary"
    },
    {
      icon: <Images className="w-6 h-6" />,
      title: "Media Library",
      description: "Centralized content repository with smart organization and sharing capabilities.",
      color: "bg-secondary"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Compliments",
      description: "Peer-to-peer appreciation system that builds positive workplace culture.",
      color: "bg-accent"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart Triggers",
      description: "Automated content delivery for birthdays, anniversaries, and special events.",
      color: "bg-purple-600"
    },
    {
      icon: <ChartLine className="w-6 h-6" />,
      title: "Analytics",
      description: "Comprehensive insights into engagement and team interaction patterns.",
      color: "bg-red-600"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Notifications",
      description: "Multi-channel notifications via email, WhatsApp, and push notifications.",
      color: "bg-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Heart className="text-primary text-2xl mr-2" />
                <span className="text-xl font-bold text-gray-900">WorkMoments</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-gray-900"
              >
                Log in
              </Button>
              <Button 
                onClick={() => navigate("/company-registration")}
                className="bg-primary text-white hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Celebrate Your Team<br />
              <span className="text-blue-200">Every Single Day</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Transform workplace recognition with NFC-powered personal timelines, instant compliments, and smart content management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-50"
                onClick={() => navigate("/employee/demo")}
              >
                <Play className="w-5 h-5 mr-2" />
                View Demo
              </Button>
              <Button 
                size="lg"
                className="bg-secondary text-white hover:bg-green-600"
                onClick={() => navigate("/company-registration")}
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Team Recognition
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From NFC-powered access to comprehensive analytics, we've got your workplace culture covered.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className={`${feature.color} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
