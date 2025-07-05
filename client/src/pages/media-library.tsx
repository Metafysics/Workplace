import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Search, Eye, Share2, Play, FolderPlus, Grid, List, Heart, Download, Filter, X, Tag, Image, Video, FileText, Layout } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaUploadModal } from "@/components/media-upload-modal";
import { TemplateUploadModal } from "@/components/template-upload-modal";
import { MediaPreviewModal } from "@/components/media-preview-modal";

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState("grid");
  const [contentType, setContentType] = useState("media"); // "media" or "templates"
  const [showUpload, setShowUpload] = useState(false);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [selectedMediaForPreview, setSelectedMediaForPreview] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch media items from API
  const { data: mediaItems = [], isLoading: isLoadingMedia } = useQuery({
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

  // Fetch templates from API
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const isLoading = isLoadingMedia || isLoadingTemplates;

  // Extract all unique tags from current content type
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    const currentItems = contentType === "media" ? mediaItems : templates;
    currentItems.forEach((item: any) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [mediaItems, templates, contentType]);

  // Filter current items based on search, type, and tags
  const filteredItems = useMemo(() => {
    const currentItems = contentType === "media" ? mediaItems : templates;
    return currentItems.filter((item: any) => {
      // Search filter
      const matchesSearch = !searchTerm || 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter (only applies to media items)
      const matchesType = contentType === "templates" || selectedType === "all" || item.type === selectedType;

      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => item.tags?.includes(tag));

      return matchesSearch && matchesType && matchesTags;
    });
  }, [mediaItems, templates, contentType, searchTerm, selectedType, selectedTags]);

  const addTagFilter = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTagFilter = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'document': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Media bibliotheek laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Media Bibliotheek</h1>
              <p className="text-gray-600">Beheer en organiseer je bedrijfsmedia en sjablonen</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setShowUpload(true)} className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Media Uploaden</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={contentType} onValueChange={setContentType} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="media" className="flex items-center space-x-2">
              <Image className="w-4 h-4" />
              <span>Media ({mediaItems.length})</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <Layout className="w-4 h-4" />
              <span>Templates ({templates.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-6">
            {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek in media bibliotheek..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter op type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="photo">📸 Foto's</SelectItem>
                  <SelectItem value="video">🎥 Video's</SelectItem>
                  <SelectItem value="document">📄 Documenten</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter op tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => 
                        selectedTags.includes(tag) 
                          ? removeTagFilter(tag) 
                          : addTagFilter(tag)
                      }
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                    className="mt-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Wis alle filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredItems.length}</div>
              <p className="text-xs text-muted-foreground">Items gevonden</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredItems.filter((item: any) => item.type === 'photo').length}
              </div>
              <p className="text-xs text-muted-foreground">Foto's</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredItems.filter((item: any) => item.type === 'video').length}
              </div>
              <p className="text-xs text-muted-foreground">Video's</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{allTags.length}</div>
              <p className="text-xs text-muted-foreground">Beschikbare tags</p>
            </CardContent>
          </Card>
        </div>

        {/* Media Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item: any) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Media Preview */}
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative">
                    <div 
                      className="w-full h-full cursor-pointer"
                      onClick={() => {
                        setSelectedMediaForPreview(item);
                        setShowPreviewModal(true);
                      }}
                    >
                      {item.type === 'photo' && item.url && (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      {item.type === 'video' && item.url && (
                        <div className="w-full h-full relative bg-black">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            controls={false}
                            muted
                            preload="metadata"
                            playsInline
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      )}
                      {item.type === 'document' && (
                        <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center relative">
                          <FileText className="w-12 h-12 text-red-500 mb-2" />
                          <span className="text-xs font-medium text-red-600 uppercase">PDF</span>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30">
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`${getTypeColor(item.type)} flex items-center space-x-1`}>
                        {getTypeIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </Badge>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title || 'Untitled'}
                    </h3>
                    
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => addTagFilter(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="text-xs text-gray-500">
                      {item.createdAt && new Date(item.createdAt).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredItems.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className={`flex items-center p-4 hover:bg-gray-50 ${
                      index !== filteredItems.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                      {item.type === 'photo' && item.url ? (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getTypeIcon(item.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.title || 'Untitled'}
                        </h3>
                        <Badge className={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                      </div>
                      
                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => addTagFilter(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        {item.createdAt && new Date(item.createdAt).toLocaleDateString('nl-NL')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <FolderPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Geen media gevonden
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedTags.length > 0 
                  ? "Probeer je zoekterm of filters aan te passen"
                  : "Upload je eerste media bestanden om te beginnen"
                }
              </p>
              {!searchTerm && selectedTags.length === 0 && (
                <Button onClick={() => setShowUpload(true)} className="mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Upload Template Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowTemplateUpload(true)} className="mb-4">
                <Upload className="w-4 h-4 mr-2" />
                Template Uploaden
              </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((template: any) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Template Preview */}
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Layout className="w-12 h-12 text-blue-500" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {template.category || 'Template'}
                        </Badge>
                      </div>
                    </div>

                    {/* Template Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {template.name || 'Naamloos Template'}
                      </h3>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      
                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.tags.slice(0, 3).map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => addTagFilter(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="text-xs text-gray-500">
                        {template.createdAt && new Date(template.createdAt).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State for Templates */}
            {filteredItems.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Geen templates gevonden
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedTags.length > 0 
                      ? "Probeer je zoekterm of filters aan te passen"
                      : "Maak je eerste template om te beginnen"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>

        {/* Upload Modals */}
        {showUpload && (
          <MediaUploadModal
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
          />
        )}

        {showTemplateUpload && (
          <TemplateUploadModal
            isOpen={showTemplateUpload}
            onClose={() => setShowTemplateUpload(false)}
          />
        )}

        {/* Media Preview Modal */}
        <MediaPreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedMediaForPreview(null);
          }}
          mediaItem={selectedMediaForPreview}
        />
      </div>
    </div>
  );
}