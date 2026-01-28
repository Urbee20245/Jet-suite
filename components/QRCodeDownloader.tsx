import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowDownTrayIcon } from './icons/MiniIcons';

interface QRCodeDownloaderProps {
  url: string;
}

export const QRCodeDownloader: React.FC<QRCodeDownloaderProps> = ({ url }) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = (format: 'png' | 'jpeg') => {
    if (!qrCodeRef.current) return;

    const canvas = qrCodeRef.current.querySelector('canvas');
    if (!canvas) return;

    const image = canvas.toDataURL(`image/${format}`);
    const link = document.createElement('a');
    link.href = image;
    link.download = `review-qr-code.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Download QR Code</h3>
      <p className="text-sm text-gray-400 mb-6">
        Use this QR code on physical marketing materials like flyers, receipts, or business cards to direct customers to your review page.
      </p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div
          ref={qrCodeRef}
          className="p-4 bg-white rounded-lg"
          style={{ lineHeight: 0 }}
        >
          <QRCodeCanvas
            value={url}
            size={160}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={false}
          />
        </div>
        <div className="flex-1 flex flex-col gap-3 w-full">
          <button
            onClick={() => downloadQRCode('png')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download as PNG
          </button>
          <button
            onClick={() => downloadQRCode('jpeg')}
            className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download as JPEG
          </button>
        </div>
      </div>
    </div>
  );
};