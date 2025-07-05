import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Image, 
  Video, 
  Type, 
  Gift, 
  Trophy, 
  Milestone,
  Heart,
  Edit,
  Eye
} from "lucide-react";

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'celebration' | 'achievement' | 'milestone' | 'compliment';
  title: string;
  content: any;
  position: number;
}

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  blocks: ContentBlock[];
  isActive: boolean;
  companyId: number;
  createdAt: string;
}

interface MediaItem {
  id: number;
  title: string;
  url: string;
  type: string;
}

export default function TemplateBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("general");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates"],
  });

  // Fetch media items for the library
  const { data: mediaItems, isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/media"],
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (templateData: any) => 
      apiRequest("POST", "/api/templates", templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      resetForm();
      toast({ title: "Template created successfully" });
    },
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...templateData }: any) =>
      apiRequest("PATCH", `/api/templates/${id}`, templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      resetForm();
      toast({ title: "Template updated successfully" });
    },
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("DELETE", `/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted successfully" });
    },
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateDescription("");
    setTemplateCategory("general");
    setContentBlocks([]);
  };

  const editTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || "");
    setTemplateCategory(template.category);
    setContentBlocks(template.blocks || []);
    setIsCreating(true);
  };

  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      title: "",
      content: {},
      position: contentBlocks.length,
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const removeContentBlock = (blockId: string) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== blockId));
  };

  const updateContentBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(contentBlocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setContentBlocks(updatedItems);
  }, [contentBlocks]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({ title: "Please enter a template name", variant: "destructive" });
      return;
    }

    const templateData = {
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      blocks: contentBlocks,
      isActive: true,
    };

    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, ...templateData });
    } else {
      createTemplate.mutate(templateData);
    }
  };

  const addMediaToBlock = (blockId: string, mediaItem: MediaItem) => {
    updateContentBlock(blockId, {
      content: { ...contentBlocks.find(b => b.id === blockId)?.content, mediaId: mediaItem.id, mediaUrl: mediaItem.url }
    });
    setShowMediaLibrary(false);
  };

  const getBlockIcon = (type: ContentBlock['type']) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'celebration': return <Gift className="w-4 h-4" />;
      case 'achievement': return <Trophy className="w-4 h-4" />;
      case 'milestone': return <Milestone className="w-4 h-4" />;
      case 'compliment': return <Heart className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  const renderContentBlock = (block: ContentBlock, isEditable: boolean = false) => {
    const commonProps = {
      className: "w-full p-2 border rounded",
    };

    switch (block.type) {
      case 'text':
        return (
          <div>
            {isEditable ? (
              <Textarea
                {...commonProps}
                placeholder="Enter text content..."
                value={block.content.text || ""}
                onChange={(e) => updateContentBlock(block.id, { 
                  content: { ...block.content, text: e.target.value }
                })}
              />
            ) : (
              <p className="p-2">{block.content.text || "Text content"}</p>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            {block.content.mediaUrl && (
              <img src={block.content.mediaUrl} alt="Content" className="w-full h-32 object-cover rounded" />
            )}
            {isEditable && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMediaLibrary(true)}
              >
                Select Image
              </Button>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            {block.content.mediaUrl && (
              <video src={block.content.mediaUrl} className="w-full h-32 rounded" controls />
            )}
            {isEditable && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMediaLibrary(true)}
              >
                Select Video
              </Button>
            )}
          </div>
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            {block.type} content block
          </div>
        );
    }
  };

  if (templatesLoading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Template Builder</h2>
          <p className="text-gray-600">Create and manage content templates with drag-and-drop blocks</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Template Creation/Editing Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateCategory">Category</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Enter template description"
                rows={3}
              />
            </div>

            {/* Content Blocks */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Content Blocks</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('text')}
                  >
                    <Type className="w-4 h-4 mr-1" /> Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('image')}
                  >
                    <Image className="w-4 h-4 mr-1" /> Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('video')}
                  >
                    <Video className="w-4 h-4 mr-1" /> Video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('celebration')}
                  >
                    <Gift className="w-4 h-4 mr-1" /> Celebration
                  </Button>
                </div>
              </div>

              {/* Drag and Drop Content Blocks */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="content-blocks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {contentBlocks.map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-lg p-4 bg-white"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab hover:cursor-grabbing"
                                >
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                  {getBlockIcon(block.type)}
                                  <span className="font-medium capitalize">{block.type}</span>
                                </div>
                                <div className="flex-1">
                                  <Input
                                    placeholder="Block title"
                                    value={block.title}
                                    onChange={(e) => updateContentBlock(block.id, { title: e.target.value })}
                                    className="text-sm"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContentBlock(block.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              {renderContentBlock(block, true)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {contentBlocks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No content blocks yet. Add some blocks to get started!
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate}
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(templates) && templates.length > 0 ? (
          templates.map((template: Template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    {template.blocks?.length || 0} content blocks
                  </div>
                  
                  {/* Preview of blocks */}
                  <div className="space-y-2">
                    {template.blocks?.slice(0, 2).map((block: ContentBlock) => (
                      <div key={block.id} className="flex items-center gap-2 text-sm">
                        {getBlockIcon(block.type)}
                        <span className="capitalize">{block.type}</span>
                        {block.title && <span className="text-gray-500">- {block.title}</span>}
                      </div>
                    ))}
                    {(template.blocks?.length || 0) > 2 && (
                      <div className="text-xs text-gray-400">
                        +{(template.blocks?.length || 0) - 2} more blocks
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editTemplate(template)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate.mutate(template.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No templates created yet. Create your first template!
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Media from Library</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {Array.isArray(mediaItems) && mediaItems.map((item: MediaItem) => (
              <div
                key={item.id}
                className="border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  // Find the current block being edited and add media
                  const currentBlockId = contentBlocks[contentBlocks.length - 1]?.id;
                  if (currentBlockId) {
                    addMediaToBlock(currentBlockId, item);
                  }
                }}
              >
                {item.type.startsWith('image') ? (
                  <img src={item.url} alt={item.title} className="w-full h-24 object-cover rounded" />
                ) : (
                  <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <p className="text-xs mt-1 truncate">{item.title}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}