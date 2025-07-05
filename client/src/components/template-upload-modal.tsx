import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, FileImage, Layout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateUploadModal({ isOpen, onClose }: TemplateUploadModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (templateData: FormData) => {
      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: templateData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template geüpload",
        description: "Je template is succesvol toegevoegd aan de bibliotheek.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Upload fout",
        description: error.message || "Er is een fout opgetreden tijdens het uploaden.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("general");
    setTags([]);
    setNewTag("");
    setFile(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast({
          title: "Bestandstype niet ondersteund",
          description: "Upload alleen afbeeldingen (PNG, JPG) of PDF bestanden.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Bestandstype niet ondersteund",
          description: "Upload alleen afbeeldingen (PNG, JPG) of PDF bestanden.",
          variant: "destructive",
        });
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Naam vereist",
        description: "Voer een naam in voor je template.",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "Bestand vereist",
        description: "Upload een template bestand.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tags));
    formData.append('templateFile', file);

    uploadMutation.mutate(formData);
  };

  const categories = [
    { value: 'general', label: 'Algemeen' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'viering', label: 'Viering' },
    { value: 'erkenning', label: 'Erkenning' },
    { value: 'communicatie', label: 'Communicatie' },
    { value: 'evenementen', label: 'Evenementen' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Layout className="w-5 h-5" />
            <span>Template Uploaden</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Template Bestand</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileImage className="w-12 h-12 text-primary mx-auto" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Verwijderen
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium">Sleep je template hierheen</p>
                  <p className="text-gray-500">of klik om een bestand te selecteren</p>
                  <p className="text-sm text-gray-400">PNG, JPG of PDF (max 10MB)</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="template-file-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('template-file-input')?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bestand Selecteren
            </Button>
          </div>

          {/* Template Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Naam *</Label>
              <Input
                id="template-name"
                placeholder="Bijv. Welkom Template"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Categorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Beschrijving</Label>
            <Textarea
              id="template-description"
              placeholder="Beschrijf waar deze template voor gebruikt wordt..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-red-100 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Nieuwe tag toevoegen..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={uploadMutation.isPending}
              className="min-w-[120px]"
            >
              {uploadMutation.isPending ? "Uploaden..." : "Template Uploaden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}