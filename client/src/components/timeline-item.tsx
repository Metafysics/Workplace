import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Download, Heart, Share2, Reply, Calendar, Trophy, Users, Gift, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MediaPreviewModal } from "@/components/media-preview-modal";

interface TimelineItemProps {
  item: {
    id: number;
    type: string;
    message: string;
    createdAt: string;
    media?: {
      id: number;
      url: string;
      title: string;
      type: string;
    };
    fromUser?: {
      name: string;
    };
  };
  employeeId?: number;
}

export default function TimelineItem({ item, employeeId }: TimelineItemProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Track media view when media is displayed
  const trackMediaView = async (mediaId: number) => {
    if (!employeeId) return;
    
    try {
      await apiRequest("POST", "/api/analytics/media-view", {
        mediaId,
        employeeId
      });
    } catch (error) {
      console.error("Failed to track media view:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Gift className="w-4 h-4 text-white" />;
      case 'achievement': return <Trophy className="w-4 h-4 text-white" />;
      case 'compliment': return <Heart className="w-4 h-4 text-white" />;
      case 'event': return <Users className="w-4 h-4 text-white" />;
      default: return <Calendar className="w-4 h-4 text-white" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'birthday': return 'bg-accent';
      case 'achievement': return 'bg-secondary';
      case 'compliment': return 'bg-purple-500';
      case 'event': return 'bg-indigo-500';
      default: return 'bg-primary';
    }
  };

  return (
    <>
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(item.type)}`}>
                {getTypeIcon(item.type)}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{item.message}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            {/* Only show download button for media items that are not compliments */}
            {item.media && item.type !== 'compliment' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  // Create download link
                  const link = document.createElement('a');
                  link.href = item.media!.url;
                  link.download = item.media!.title;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
        
        {/* Media Content */}
        {item.media && (
          <div 
            className="aspect-video bg-gray-100 cursor-pointer relative overflow-hidden"
            onClick={() => setShowPreviewModal(true)}
          >
            {item.media.type === 'video' ? (
              <div className="w-full h-full relative bg-black">
                <video 
                  src={item.media.url} 
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  preload="metadata"
                  playsInline
                  onLoadedMetadata={() => {
                    // Track media view when video metadata loads
                    if (item.media?.id) {
                      trackMediaView(item.media.id);
                    }
                  }}
                  onError={(e) => {
                    // Hide broken video and show placeholder
                    const target = e.target as HTMLVideoElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.video-error')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'video-error w-full h-full flex items-center justify-center bg-gray-700';
                      errorDiv.innerHTML = '<div class="text-center text-white"><div class="text-2xl mb-2">🎥</div><p>Video preview niet beschikbaar</p></div>';
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-40 transition-all">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : item.media.type === 'document' ? (
              <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="text-4xl mb-2 text-red-500">📄</div>
                  <p className="text-red-700 font-medium text-sm truncate px-2">
                    {item.media.title.replace(/\.[^/.]+$/, "")}
                  </p>
                  <p className="text-red-500 text-xs">PDF</p>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <img 
                  src={item.media.url} 
                  alt={item.media.title}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    // Track media view when image loads successfully
                    if (item.media?.id) {
                      trackMediaView(item.media.id);
                    }
                  }}
                  onError={(e) => {
                    // Show better placeholder for broken images
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.image-error')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'image-error w-full h-full flex items-center justify-center bg-gray-200';
                      errorDiv.innerHTML = '<div class="text-center text-gray-500"><div class="text-2xl mb-2">🖼️</div><p>Afbeelding niet beschikbaar</p></div>';
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {item.fromUser ? `Van ${item.fromUser.name}` : 'Van WorkMoments'}
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700">
                <Heart className="w-4 h-4" />
              </Button>
              {item.type === 'compliment' ? (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700">
                  <Reply className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700">
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Media Preview Modal */}
      {item.media && (
        <MediaPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          mediaItem={item.media}
        />
      )}
    </>
  );
}