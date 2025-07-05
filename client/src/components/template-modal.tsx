import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateModal({ isOpen, onClose }: TemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get list of media items for template content
  const { data: mediaItems } = useQuery({
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
    enabled: isOpen,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name: name.trim(),
        description: description.trim(),
        content: content.trim(),
        category,
        isActive,
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Success",
        description: "Template created successfully!",
      });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setContent("");
    setCategory("");
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name and content for the template.",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const insertMediaReference = (mediaId: number, mediaTitle: string) => {
    const reference = `[MEDIA:${mediaId}:${mediaTitle}]`;
    setContent(prev => prev + reference + "\n\n");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Content Template</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Birthday Celebration, New Employee Welcome"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this template"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="anniversary">Work Anniversary</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="welcome">New Employee Welcome</SelectItem>
                <SelectItem value="holiday">Holiday Celebration</SelectItem>
                <SelectItem value="milestone">Company Milestone</SelectItem>
                <SelectItem value="training">Training Completion</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Template Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your template content here. Use [EMPLOYEE_NAME], [DATE], [DEPARTMENT] as placeholders."
              rows={8}
              required
            />
            <p className="text-xs text-gray-500">
              You can use placeholders like [EMPLOYEE_NAME], [DATE], [DEPARTMENT], [YEARS_OF_SERVICE] that will be automatically replaced.
            </p>
          </div>

          {/* Media References */}
          {mediaItems && mediaItems.length > 0 && (
            <div className="space-y-2">
              <Label>Add Media References</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-2">Click to add media to your template:</p>
                <div className="space-y-1">
                  {mediaItems.map((media: any) => (
                    <Button
                      key={media.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start h-auto p-2 text-left"
                      onClick={() => insertMediaReference(media.id, media.title)}
                    >
                      <div>
                        <div className="font-medium text-sm">{media.title}</div>
                        <div className="text-xs text-gray-500">{media.type}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="isActive">Active template (available for use)</Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTemplateMutation.isPending || !name.trim() || !content.trim()}
            >
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}