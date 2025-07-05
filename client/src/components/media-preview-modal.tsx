import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, FileText, Play, AlertCircle } from "lucide-react";
import { useState } from "react";

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: {
    id: number;
    title: string;
    type: string;
    url: string;
  } | null;
}

export function MediaPreviewModal({ isOpen, onClose, mediaItem }: MediaPreviewModalProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  if (!mediaItem) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaItem.url;
    link.download = mediaItem.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(mediaItem.url, '_blank');
  };

  const renderMediaContent = () => {
    switch (mediaItem.type) {
      case 'photo':
      case 'image':
        if (imageError) {
          return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-50">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Afbeelding kon niet worden geladen</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download bestand
              </Button>
            </div>
          );
        }
        return (
          <div className="w-full max-h-[70vh] flex items-center justify-center bg-black">
            <img
              src={mediaItem.url}
              alt={mediaItem.title}
              className="max-w-full max-h-full object-contain"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          </div>
        );

      case 'video':
        if (videoError) {
          return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-50">
              <Play className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Video kon niet worden geladen</p>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download video
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in nieuwe tab
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-[70vh] bg-black">
            <video
              src={mediaItem.url}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
              onError={() => setVideoError(true)}
              onLoadedMetadata={() => setVideoError(false)}
            />
          </div>
        );

      case 'document':
        if (pdfError) {
          return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-50">
              <FileText className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-gray-600 mb-2">PDF kon niet worden weergegeven</p>
              <p className="text-sm text-gray-500 mb-4">Sommige browsers ondersteunen geen PDF preview</p>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in nieuwe tab
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-[70vh] bg-white">
            <iframe
              src={`${mediaItem.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              title={mediaItem.title}
              allow="fullscreen"
              onError={() => setPdfError(true)}
              onLoad={(e) => {
                // Check if iframe loaded successfully
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  if (iframe.contentDocument === null) {
                    setPdfError(true);
                  }
                } catch (error) {
                  setPdfError(true);
                }
              }}
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-50">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Bestandstype wordt niet ondersteund voor preview</p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download bestand
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">
              {mediaItem.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Nieuwe tab
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {renderMediaContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}