import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Download, Share2, Reply, Users } from "lucide-react";
import { useState } from "react";
import { ComplimentModal } from "@/components/compliment-modal";
import TimelineItem from "@/components/timeline-item";

export default function EmployeeTimeline() {
  const { token } = useParams();
  const [showComplimentModal, setShowComplimentModal] = useState(false);

  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['/api/employee', token],
    queryFn: async () => {
      const response = await fetch(`/api/employee/${token}`);
      if (!response.ok) throw new Error('Employee not found');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
            <p className="text-gray-600">The NFC token you used is invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { employee, timelineItems } = employeeData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-white">
                  {employee.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{employee.name}</h1>
                <p className="text-sm text-gray-500">{employee.department}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowComplimentModal(true)}
                className="bg-accent text-white hover:bg-yellow-600"
                size="sm"
              >
                <Heart className="w-4 h-4 mr-1" />
                Send Compliment
              </Button>
              <Button
                onClick={() => window.open(`/referral/${employee.id}`, '_blank')}
                className="bg-secondary text-white hover:bg-green-600"
                size="sm"
              >
                <Users className="w-4 h-4 mr-1" />
                Referral Programma
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Message */}
        <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Welcome to Your Timeline!</h2>
            <p className="text-blue-100">Here are all your special moments and team memories</p>
          </CardContent>
        </Card>
        
        {/* Timeline Items */}
        <div className="space-y-6">
          {timelineItems?.length > 0 ? (
            timelineItems.map((item: any) => (
              <TimelineItem key={item.id} item={item} employeeId={employee.id} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">No timeline items yet. Your memories will appear here!</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Load More */}
        {timelineItems?.length > 0 && (
          <div className="text-center py-4">
            <Button variant="outline" className="bg-gray-200 text-gray-700 hover:bg-gray-300">
              Load More Memories
            </Button>
          </div>
        )}
      </div>
      
      {/* Floating Send Compliment Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowComplimentModal(true)}
          className="bg-accent text-white w-14 h-14 rounded-full shadow-lg hover:bg-yellow-600 transition-colors"
          size="icon"
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>

      <ComplimentModal 
        isOpen={showComplimentModal} 
        onClose={() => setShowComplimentModal(false)}
        employees={employeeData.companyEmployees}
      />
    </div>
  );
}
