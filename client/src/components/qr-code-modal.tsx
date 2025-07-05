import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Download, Copy, ExternalLink } from "lucide-react";
import { QRCodeComponent } from "@/components/qr-code";
import { useToast } from "@/hooks/use-toast";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: number;
    name: string;
    email: string;
    nfcToken: string;
    department: string;
  };
}

export function QRCodeModal({ isOpen, onClose, employee }: QRCodeModalProps) {
  const { toast } = useToast();
  
  // Generate the URL that the QR code should point to
  const profileUrl = `${window.location.origin}/employee/${employee.nfcToken}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Gekopieerd!",
      description: "URL is gekopieerd naar het klembord",
    });
  };

  const downloadQRCode = () => {
    const img = document.querySelector('.qr-code-image') as HTMLImageElement;
    if (img) {
      const link = document.createElement('a');
      link.download = `qrcode-${employee.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = img.src;
      link.click();
      
      toast({
        title: "QR Code Gedownload",
        description: `QR code voor ${employee.name} is gedownload`,
      });
    }
  };

  const openProfilePage = () => {
    window.open(profileUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code voor {employee.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.department}</p>
                  <p className="text-xs text-gray-500">{employee.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeComponent 
                value={profileUrl} 
                size={200} 
                className="qr-code-image"
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Scan deze QR code om naar het profiel te gaan
              </p>
              <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                {profileUrl}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Hoe te gebruiken:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Print de QR code en plaats deze op het bureau van de werknemer</li>
                <li>• Werknemers kunnen de code scannen met hun telefoon</li>
                <li>• Ze krijgen direct toegang tot hun persoonlijke timeline</li>
                <li>• Werkt op dezelfde manier als de NFC token</li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={openProfilePage}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Test Profiel
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => copyToClipboard(profileUrl)}>
                <Copy className="w-4 h-4 mr-2" />
                Kopieer URL
              </Button>
              
              <Button onClick={downloadQRCode} className="bg-primary text-white">
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}