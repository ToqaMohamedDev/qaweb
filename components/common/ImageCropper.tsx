'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import imageCompression from 'browser-image-compression';
import { X, Check, RotateCcw, Loader2 } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

export interface ImageCropperProps {
    /** الصورة المُحملة (File object) */
    imageFile: File;
    /** نسبة العرض للارتفاع (1 = مربع, 16/9 = مستطيل عريض) */
    aspectRatio?: number;
    /** الحد الأقصى للعرض بعد الضغط (بالبكسل) */
    maxWidth?: number;
    /** الحد الأقصى لحجم الملف بعد الضغط (بالميجابايت) */
    maxSizeMB?: number;
    /** جودة الضغط (0-1) */
    quality?: number;
    /** عند الإلغاء */
    onCancel: () => void;
    /** عند الانتهاء من القص والضغط */
    onComplete: (croppedFile: File) => void;
    /** العنوان */
    title?: string;
}

// تحويل الـ crop إلى canvas
async function getCroppedImage(
    image: HTMLImageElement,
    crop: PixelCrop,
    fileName: string
): Promise<File> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2D context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const file = new File([blob], fileName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
                resolve(file);
            },
            'image/jpeg',
            0.95
        );
    });
}

// إنشاء crop مبدئي في المنتصف
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
): Crop {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export function ImageCropper({
    imageFile,
    aspectRatio = 1,
    maxWidth = 800,
    maxSizeMB = 0.5,
    quality = 0.8,
    onCancel,
    onComplete,
    title = 'قص الصورة',
}: ImageCropperProps) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // تحميل الصورة
    useState(() => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result?.toString() || '');
        });
        reader.readAsDataURL(imageFile);
    });

    // عند تحميل الصورة
    const onImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspectRatio));
        },
        [aspectRatio]
    );

    // إعادة ضبط الـ crop
    const handleReset = useCallback(() => {
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            setCrop(centerAspectCrop(width, height, aspectRatio));
        }
    }, [aspectRatio]);

    // تأكيد القص
    const handleConfirm = useCallback(async () => {
        if (!imgRef.current || !completedCrop) return;

        setIsProcessing(true);
        try {
            // قص الصورة
            const croppedFile = await getCroppedImage(
                imgRef.current,
                completedCrop,
                imageFile.name.replace(/\.[^/.]+$/, '.jpg')
            );

            // ضغط الصورة
            const compressedFile = await imageCompression(croppedFile, {
                maxWidthOrHeight: maxWidth,
                maxSizeMB: maxSizeMB,
                initialQuality: quality,
                useWebWorker: true,
            });

            onComplete(compressedFile);
        } catch (error) {
            console.error('Error processing image:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [completedCrop, imageFile.name, maxSizeMB, maxWidth, onComplete, quality]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cropper */}
                <div className="p-6">
                    <div className="flex justify-center bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden">
                        {imageSrc && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspectRatio}
                                className="max-h-[60vh]"
                            >
                                <img
                                    ref={imgRef}
                                    alt="قص الصورة"
                                    src={imageSrc}
                                    onLoad={onImageLoad}
                                    className="max-h-[60vh]"
                                />
                            </ReactCrop>
                        )}
                    </div>

                    {/* نسبة القص والمقاس */}
                    <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {aspectRatio === 1 ? (
                            <span>صورة شخصية مربعة (256×256px)</span>
                        ) : aspectRatio === 2.5 ? (
                            <span>صورة غلاف عريضة (1200×480px)</span>
                        ) : aspectRatio === 3 ? (
                            <span>صورة غلاف عريضة (1200×400px)</span>
                        ) : aspectRatio === 16 / 9 ? (
                            <span>نسبة عريضة (16:9)</span>
                        ) : (
                            <span>نسبة {aspectRatio.toFixed(2)}:1</span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        إعادة ضبط
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing || !completedCrop}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري المعالجة...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    تأكيد
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageCropper;
