
import React, { useState, useRef, useEffect } from 'react';
import { extractExpenseDataFromImage, OcrData } from '../../services/gemini';
import { useAppContext } from '../../context/AppContext';
import Modal from './Modal';

const CameraIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2 2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm0 1.9c2.97 0 6.1 1.46 6.1 2.1v.9H5.9v-.9c0-.64 3.13-2.1 6.1-2.1M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
);
const ReplayIcon = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
);


interface CameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (data: OcrData) => void;
    isScanning: boolean;
    setIsScanning: (isScanning: boolean) => void;
}

// FIX: Removed explicit ReactElement return type to allow TypeScript to correctly infer the component's type.
const CameraScannerModal = ({ isOpen, onClose, onScanSuccess, isScanning, setIsScanning }: CameraScannerModalProps) => {
    const { addToast } = useAppContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCapturedImage(null);
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            const message = "No se pudo acceder a la cámara. Comprueba los permisos en tu navegador.";
            setError(message);
            addToast(message, 'error');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };
    
    const handleConfirm = async () => {
        if (capturedImage) {
            setIsScanning(true);
            setError(null);
            try {
                // remove data:image/jpeg;base64, prefix
                const base64Image = capturedImage.split(',')[1];
                const data = await extractExpenseDataFromImage(base64Image);
                addToast('Datos extraídos con éxito.', 'success');
                onScanSuccess(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Error desconocido durante el escaneo.";
                setError(message);
                addToast(message, 'error');
            } finally {
                setIsScanning(false);
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <Modal title="Escanear Factura" isOpen={isOpen} onClose={onClose}>
            <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-md overflow-hidden">
                {error && !isScanning && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-red-400 bg-black bg-opacity-70">{error}</div>}

                {isScanning && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-black bg-opacity-70 z-20">
                        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2">Analizando imagen...</p>
                    </div>
                )}
                
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            <div className="flex justify-center mt-4 space-x-4">
                {capturedImage ? (
                    <>
                        <button onClick={handleRetake} disabled={isScanning} className="p-3 rounded-full bg-gray-600 text-white disabled:bg-gray-400">
                            <ReplayIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={handleConfirm} disabled={isScanning} className="px-6 py-2 rounded-full bg-primary-600 text-white font-semibold disabled:bg-primary-400">
                            Confirmar
                        </button>
                    </>
                ) : (
                    <button onClick={handleCapture} disabled={!stream} className="p-4 rounded-full bg-white border-4 border-primary-500 disabled:bg-gray-400">
                       <span className="sr-only">Capturar</span>
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default CameraScannerModal;