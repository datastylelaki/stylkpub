"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
    connectPrinter,
    disconnectPrinter,
    isConnected,
    isBluetoothSupported,
    getDeviceName,
    printReceipt,
    type ReceiptData,
} from "@/lib/thermal-printer";

interface PrinterContextValue {
    connected: boolean;
    connecting: boolean;
    printing: boolean;
    deviceName: string | null;
    bluetoothSupported: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    print: (data: ReceiptData) => Promise<void>;
}

const PrinterContext = createContext<PrinterContextValue | null>(null);

export function PrinterProvider({ children }: { children: ReactNode }) {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const [bluetoothSupported, setBluetoothSupported] = useState(false);

    useEffect(() => {
        setBluetoothSupported(isBluetoothSupported());
    }, []);

    // Poll connection status (handles unexpected disconnects)
    useEffect(() => {
        if (!connected) return;
        const interval = setInterval(() => {
            if (!isConnected()) {
                setConnected(false);
                setDeviceName(null);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [connected]);

    const connect = useCallback(async () => {
        setConnecting(true);
        try {
            await connectPrinter();
            setConnected(true);
            setDeviceName(getDeviceName());
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Gagal terhubung ke printer";
            throw new Error(msg);
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        disconnectPrinter();
        setConnected(false);
        setDeviceName(null);
    }, []);

    const print = useCallback(async (data: ReceiptData) => {
        setPrinting(true);
        try {
            await printReceipt(data);
        } finally {
            setPrinting(false);
        }
    }, []);

    return (
        <PrinterContext.Provider
            value={{
                connected,
                connecting,
                printing,
                deviceName,
                bluetoothSupported,
                connect,
                disconnect,
                print,
            }}
        >
            {children}
        </PrinterContext.Provider>
    );
}

export function usePrinter() {
    const ctx = useContext(PrinterContext);
    if (!ctx) throw new Error("usePrinter must be used within PrinterProvider");
    return ctx;
}
