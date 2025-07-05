import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Eye, Share2, Play, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { MediaSendModal } from "@/components/media-send-modal";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MediaGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState<any>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['/api/media'],
    queryFn: async () => {
      const response = await fetch('/api/media', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    },
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const response = await apiRequest('DELETE', `/api/media/${mediaId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Media Verwijderd",
        description: "Het media item is succesvol verwijderd.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Het verwijderen van de media is mislukt. Probeer opnieuw.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMedia = async (mediaItem: any) => {
    if (window.confirm(`Weet je zeker dat je "${mediaItem.title}" wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.`)) {
      deleteMediaMutation.mutate(mediaItem.id);
    }
  };

  const filteredMedia = mediaItems.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-green-100 text-green-800';
      case 'document': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600">Manage all your company's photos, videos, and content</p>
          </div>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 aspect-square rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600">Manage all your company's photos, videos, and content</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-primary text-white hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
      </div>
      
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="marketing">Marketing Team</SelectItem>
                  <SelectItem value="development">Development Team</SelectItem>
                  <SelectItem value="hr">HR Team</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Recent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most-used">Most Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Tags Filter */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Filter by tags:</span>
            <Badge variant="default" className="cursor-pointer hover:bg-primary/80">
              Team Events
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300">
              Birthdays
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300">
              Achievements
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300">
              Meetings
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredMedia.map((item: any) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="aspect-square bg-gray-100 relative">
              {item.type === 'video' && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 p-2 rounded-full">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                </div>
              )}
              <img 
                src={item.url} 
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/400x400?text=${item.type}`;
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedMediaItem(item);
                      setShowPreviewModal(true);
                    }}
                    title="Media bekijken"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedMediaItem(item);
                      setShowSendModal(true);
                    }}
                    title="Media delen"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMedia(item);
                    }}
                    title="Media verwijderen"
                    disabled={deleteMediaMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <CardContent className="p-3">
              <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{item.title}</h4>
              <p className="text-xs text-gray-500 mb-2">{new Date(item.createdAt).toLocaleDateString()}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className={getTypeColor(item.type)}>
                  {item.type}
                </Badge>
                {item.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Load More */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No media items found. Upload some content to get started!</p>
        </div>
      ) : (
        <div className="text-center">
          <Button variant="outline" className="bg-gray-200 text-gray-700 hover:bg-gray-300">
            Load More Media
          </Button>
        </div>
      )}

      {showUpload && (
        <FileUpload 
          onClose={() => setShowUpload(false)}
          onUpload={() => {
            setShowUpload(false);
            queryClient.invalidateQueries({ queryKey: ['/api/media'] });
          }}
        />
      )}

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedMediaItem(null);
        }}
        mediaItem={selectedMediaItem}
      />

      {/* Media Send Modal */}
      <MediaSendModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedMediaItem(null);
        }}
        mediaItem={selectedMediaItem}
      />
    </div>
  );
}
