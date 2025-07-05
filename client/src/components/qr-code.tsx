interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({ value, size = 200, className = "" }: QRCodeProps) {
  // Use QR Server API to generate QR codes
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <img
      src={qrCodeUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={`border border-gray-200 rounded ${className}`}
      style={{ 
        maxWidth: '100%', 
        height: 'auto',
        backgroundColor: 'white' 
      }}
    />
  );
}