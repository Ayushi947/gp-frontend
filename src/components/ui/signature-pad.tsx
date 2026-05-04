'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconEraser, IconDownload, IconCheck, IconHandFinger } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export interface SignatureData {
  /** Base64 PNG data URL of the signature */
  dataUrl: string;
  /** Whether the signature canvas has any content */
  isEmpty: boolean;
  /** Timestamp when signature was captured */
  timestamp: Date;
}

interface SignaturePadProps {
  /** Callback fired when signature changes */
  onSignatureChange?: (data: SignatureData | null) => void;
  /** Width of the canvas (default: 100%) */
  width?: number | string;
  /** Height of the canvas in pixels (default: 200) */
  height?: number;
  /** Pen color (default: #1e3a5f - dark blue) */
  penColor?: string;
  /** Background color (default: #fafafa) */
  backgroundColor?: string;
  /** Label text (default: "Draw your signature below") */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Whether the canvas is disabled */
  disabled?: boolean;
  /** Show typed signature option */
  showTypedSignature?: boolean;
  /** Typed name for fallback signature */
  typedName?: string;
}

export function SignaturePad({
  onSignatureChange,
  width = '100%',
  height = 200,
  penColor = '#1e3a5f',
  backgroundColor = '#fafafa',
  label = 'Draw your signature below',
  className,
  disabled = false,
  showTypedSignature = true,
  typedName = '',
}: SignaturePadProps) {
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [canvasWidth, setCanvasWidth] = useState(0);

  // Handle responsive canvas width
  useEffect(() => {
    const updateCanvasWidth = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.offsetWidth);
      }
    };

    updateCanvasWidth();
    window.addEventListener('resize', updateCanvasWidth);
    return () => window.removeEventListener('resize', updateCanvasWidth);
  }, []);

  // Notify parent of signature changes
  const notifyChange = useCallback(() => {
    if (!onSignatureChange) return;

    if (signatureMode === 'draw') {
      if (sigCanvasRef.current?.isEmpty()) {
        onSignatureChange(null);
      } else {
        const dataUrl = sigCanvasRef.current?.getTrimmedCanvas().toDataURL('image/png') || '';
        onSignatureChange({
          dataUrl,
          isEmpty: false,
          timestamp: new Date(),
        });
      }
    } else if (signatureMode === 'type' && typedName.trim()) {
      // Generate signature image from typed name
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth || 500;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = penColor;
        ctx.font = "italic 48px 'Brush Script MT', cursive, serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

        onSignatureChange({
          dataUrl: canvas.toDataURL('image/png'),
          isEmpty: false,
          timestamp: new Date(),
        });
      }
    } else {
      onSignatureChange(null);
    }
  }, [signatureMode, typedName, onSignatureChange, canvasWidth, height, backgroundColor, penColor]);

  // Update signature when mode or typed name changes
  useEffect(() => {
    notifyChange();
  }, [signatureMode, typedName, notifyChange]);

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsEmpty(true);
      onSignatureChange?.(null);
    }
  };

  const handleEnd = () => {
    const empty = sigCanvasRef.current?.isEmpty() ?? true;
    setIsEmpty(empty);
    notifyChange();
  };

  const handleDownload = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `signature-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className={cn('space-y-3', className)} ref={containerRef}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {showTypedSignature && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <Button
              type="button"
              variant={signatureMode === 'draw' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSignatureMode('draw')}
              className="h-7 px-3 text-xs"
              disabled={disabled}
            >
              <IconHandFinger className="h-3.5 w-3.5 mr-1" />
              Draw
            </Button>
            <Button
              type="button"
              variant={signatureMode === 'type' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSignatureMode('type')}
              className="h-7 px-3 text-xs"
              disabled={disabled}
            >
              Type
            </Button>
          </div>
        )}
      </div>

      {signatureMode === 'draw' ? (
        <>
          <div
            className={cn(
              'relative rounded-lg border-2 border-dashed transition-colors',
              disabled
                ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                : isEmpty
                  ? 'border-gray-300 hover:border-blue-400'
                  : 'border-green-400 bg-green-50/30'
            )}
            style={{ width, height }}
          >
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor={penColor}
              backgroundColor={backgroundColor}
              canvasProps={{
                width: canvasWidth || 500,
                height,
                className: cn('rounded-lg', disabled && 'pointer-events-none opacity-50'),
                style: { width: '100%', height: '100%' },
              }}
              onEnd={handleEnd}
            />

            {/* Placeholder text */}
            {isEmpty && !disabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <IconHandFinger className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sign here with your mouse or finger</p>
                </div>
              </div>
            )}

            {/* Signature complete indicator */}
            {!isEmpty && (
              <div className="absolute top-2 right-2">
                <div className="bg-green-500 text-white rounded-full p-1">
                  <IconCheck className="h-3 w-3" />
                </div>
              </div>
            )}
          </div>

          {/* Canvas Controls */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={disabled || isEmpty}
              className="flex-1"
            >
              <IconEraser className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={disabled || isEmpty}
              className="flex-1"
            >
              <IconDownload className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </>
      ) : (
        /* Typed Signature Mode */
        <div
          className={cn(
            'relative rounded-lg border-2 transition-colors flex items-center justify-center',
            disabled
              ? 'border-gray-200 bg-gray-100'
              : typedName.trim()
                ? 'border-green-400 bg-green-50/30'
                : 'border-gray-300 bg-gray-50'
          )}
          style={{ width, height }}
        >
          {typedName.trim() ? (
            <div className="text-center">
              <p
                className="text-4xl italic text-gray-800"
                style={{ fontFamily: "'Brush Script MT', cursive, serif" }}
              >
                {typedName}
              </p>
              <p className="text-xs text-gray-500 mt-2">Typed signature</p>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-sm">Enter your name above to generate signature</p>
            </div>
          )}

          {/* Signature complete indicator */}
          {typedName.trim() && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-500 text-white rounded-full p-1">
                <IconCheck className="h-3 w-3" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legal notice */}
      <p className="text-xs text-gray-500">
        By signing above, you agree that this electronic signature is legally binding and has the
        same legal effect as a handwritten signature.
      </p>
    </div>
  );
}

export default SignaturePad;
