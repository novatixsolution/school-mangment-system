import { useState } from 'react';
import QRCode from 'qrcode.react';

interface QRCodeGeneratorProps {
    value: string;
    onChange: (value: string) => void;
    size?: number;
}

export function QRCodeGenerator({ value, onChange, size = 128 }: QRCodeGeneratorProps) {
    const [inputValue, setInputValue] = useState(value || '');

    const handleGenerate = () => {
        onChange(inputValue);
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code Content
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter text or URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleGenerate}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Generate
                    </button>
                </div>
            </div>

            {value && (
                <div className="flex flex-col items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <QRCode value={value} size={size} level="M" />
                    <p className="text-xs text-gray-500 mt-2 text-center break-all">{value}</p>
                </div>
            )}
        </div>
    );
}

// Standalone component for displaying QR code only
interface QRCodeDisplayProps {
    value: string;
    size?: number;
    className?: string;
}

export function QRCodeDisplay({ value, size = 128, className = '' }: QRCodeDisplayProps) {
    if (!value) return null;

    return (
        <div className={className}>
            <QRCode value={value} size={size} level="M" />
        </div>
    );
}
