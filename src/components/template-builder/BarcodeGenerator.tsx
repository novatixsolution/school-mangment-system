import { useState } from 'react';
import Barcode from 'react-barcode';

type BarcodeFormat = 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39';

interface BarcodeGeneratorProps {
    value: string;
    onChange: (value: string) => void;
    format?: BarcodeFormat;
}

export function BarcodeGenerator({
    value,
    onChange,
    format = 'CODE128',
}: BarcodeGeneratorProps) {
    const [inputValue, setInputValue] = useState(value || '');
    const [selectedFormat, setSelectedFormat] = useState<BarcodeFormat>(format);

    const handleGenerate = () => {
        onChange(inputValue);
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode Value
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter barcode value"
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode Format
                </label>
                <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as BarcodeFormat)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="CODE128">CODE128 (Most common)</option>
                    <option value="EAN13">EAN13 (13 digits)</option>
                    <option value="EAN8">EAN8 (8 digits)</option>
                    <option value="UPC">UPC (Universal Product Code)</option>
                    <option value="CODE39">CODE39</option>
                </select>
            </div>

            {value && (
                <div className="flex flex-col items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <BarcodeDisplay value={value} format={selectedFormat} />
                    <p className="text-xs text-gray-500 mt-2">{value}</p>
                </div>
            )}
        </div>
    );
}

// Standalone component for displaying barcode only
interface BarcodeDisplayProps {
    value: string;
    format?: BarcodeFormat;
    width?: number;
    height?: number;
    className?: string;
}

export function BarcodeDisplay({
    value,
    format = 'CODE128',
    width = 2,
    height = 50,
    className = '',
}: BarcodeDisplayProps) {
    if (!value) return null;

    try {
        return (
            <div className={className}>
                <Barcode value={value} format={format} width={width} height={height} />
            </div>
        );
    } catch (error) {
        return (
            <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                Invalid barcode value for format {format}
            </div>
        );
    }
}
