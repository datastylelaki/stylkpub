// Thermal Printer Bluetooth utility for ESC/POS 58mm printers
// Compatible with VSC MP-58C and similar Bluetooth thermal printers

const PRINTER_SERVICE_UUIDS = [
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    "000018f0-0000-1000-8000-00805f9b34fb",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
];

const WRITE_CHARACTERISTIC_UUIDS = [
    "0000ff02-0000-1000-8000-00805f9b34fb",
    "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
    "00002af1-0000-1000-8000-00805f9b34fb",
    "49535343-8841-43f4-a8d4-ecbe34729bb3",
];

const CHARS_PER_LINE = 32; // 58mm paper = 32 chars per line
const CHUNK_SIZE = 100; // bytes per BLE write
const CHUNK_DELAY = 50; // ms between chunks

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
    INIT: [ESC, 0x40],
    BOLD_ON: [ESC, 0x45, 0x01],
    BOLD_OFF: [ESC, 0x45, 0x00],
    ALIGN_CENTER: [ESC, 0x61, 0x01],
    ALIGN_LEFT: [ESC, 0x61, 0x00],
    ALIGN_RIGHT: [ESC, 0x61, 0x02],
    DOUBLE_SIZE: [GS, 0x21, 0x11],
    DOUBLE_WIDTH: [GS, 0x21, 0x10],
    DOUBLE_HEIGHT: [GS, 0x21, 0x01],
    NORMAL_SIZE: [GS, 0x21, 0x00],
    FEED_LINES: (n: number) => [ESC, 0x64, n],
    CUT: [GS, 0x56, 0x01],
    PARTIAL_CUT: [GS, 0x56, 0x42, 0x00],
} as const;

export interface PrinterConnection {
    device: BluetoothDevice;
    server: BluetoothRemoteGATTServer;
    characteristic: BluetoothRemoteGATTCharacteristic;
}

export interface ReceiptData {
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    receiptFooter?: string;
    items: {
        name: string;
        variantInfo: string;
        quantity: number;
        price: number;
    }[];
    total: number;
    paymentMethod: "cash" | "qris";
    cashReceived?: number;
    changeAmount?: number;
    cashierName: string;
    transactionId: string;
    date: Date;
}

let connection: PrinterConnection | null = null;

export function isBluetoothSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function isConnected(): boolean {
    return connection?.device?.gatt?.connected === true;
}

export function getDeviceName(): string | null {
    return connection?.device?.name ?? null;
}

export async function connectPrinter(): Promise<PrinterConnection> {
    if (!isBluetoothSupported()) {
        throw new Error("Bluetooth tidak didukung di browser ini");
    }

    // Request device with name filter for the VSC printer
    const device = await navigator.bluetooth.requestDevice({
        filters: [
            { namePrefix: "Portable" },
            { namePrefix: "VSC" },
            { namePrefix: "MP-58" },
            { namePrefix: "Printer" },
            { namePrefix: "BlueTooth" },
            { namePrefix: "BT" },
        ],
        optionalServices: PRINTER_SERVICE_UUIDS,
    });

    if (!device.gatt) {
        throw new Error("Printer tidak mendukung GATT");
    }

    const server = await device.gatt.connect();

    // Try to find the right service and characteristic
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
        try {
            const service = await server.getPrimaryService(serviceUuid);
            for (const charUuid of WRITE_CHARACTERISTIC_UUIDS) {
                try {
                    const char = await service.getCharacteristic(charUuid);
                    if (char.properties.write || char.properties.writeWithoutResponse) {
                        characteristic = char;
                        break;
                    }
                } catch {
                    // Try next characteristic
                }
            }
            if (characteristic) break;

            // If specific characteristics didn't work, try getting all
            const chars = await service.getCharacteristics();
            for (const char of chars) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                    characteristic = char;
                    break;
                }
            }
            if (characteristic) break;
        } catch {
            // Try next service
        }
    }

    if (!characteristic) {
        server.disconnect();
        throw new Error("Tidak dapat menemukan karakteristik printer");
    }

    connection = { device, server, characteristic };

    // Listen for disconnection
    device.addEventListener("gattserverdisconnected", () => {
        connection = null;
    });

    return connection;
}

export function disconnectPrinter(): void {
    if (connection?.device?.gatt?.connected) {
        connection.device.gatt.disconnect();
    }
    connection = null;
}

async function writeData(data: Uint8Array): Promise<void> {
    if (!connection?.characteristic) {
        throw new Error("Printer tidak terhubung");
    }

    // Send data in chunks
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        if (connection.characteristic.properties.writeWithoutResponse) {
            await connection.characteristic.writeValueWithoutResponse(chunk);
        } else {
            await connection.characteristic.writeValueWithResponse(chunk);
        }
        if (offset + CHUNK_SIZE < data.length) {
            await new Promise((r) => setTimeout(r, CHUNK_DELAY));
        }
    }
}

function textToBytes(text: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < 128) {
            bytes.push(code);
        } else {
            // For non-ASCII chars, replace with closest ASCII equivalent
            bytes.push(0x3f); // '?'
        }
    }
    return bytes;
}

function padRight(text: string, length: number): string {
    return text.length >= length ? text.substring(0, length) : text + " ".repeat(length - text.length);
}

function padLeft(text: string, length: number): string {
    return text.length >= length ? text.substring(0, length) : " ".repeat(length - text.length) + text;
}

function formatCurrency(amount: number): string {
    return "Rp" + amount.toLocaleString("id-ID");
}

function line(char: string = "-"): string {
    return char.repeat(CHARS_PER_LINE);
}

export function buildReceipt(data: ReceiptData): Uint8Array {
    const bytes: number[] = [];

    function cmd(...commands: number[]) {
        bytes.push(...commands);
    }

    function text(str: string) {
        bytes.push(...textToBytes(str));
    }

    function newline() {
        bytes.push(LF);
    }

    function println(str: string = "") {
        text(str);
        newline();
    }

    // Initialize printer
    cmd(...CMD.INIT);

    // Store header - centered, bold, double size
    cmd(...CMD.ALIGN_CENTER);
    cmd(...CMD.DOUBLE_SIZE);
    cmd(...CMD.BOLD_ON);
    println(data.storeName);
    cmd(...CMD.NORMAL_SIZE);
    cmd(...CMD.BOLD_OFF);
    if (data.storeAddress) println(data.storeAddress);
    if (data.storePhone) println(data.storePhone);
    newline();

    // Transaction info
    cmd(...CMD.ALIGN_LEFT);
    cmd(...CMD.NORMAL_SIZE);
    println(line("="));

    const dateStr = data.date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    const timeStr = data.date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

    println(`Tgl : ${dateStr} ${timeStr}`);
    println(`No  : ${data.transactionId.substring(0, 8).toUpperCase()}`);
    println(`Kasir: ${data.cashierName}`);
    println(line("="));

    // Items
    for (const item of data.items) {
        // Product name
        const nameStr = item.name.length > CHARS_PER_LINE
            ? item.name.substring(0, CHARS_PER_LINE)
            : item.name;
        println(nameStr);

        // Variant info if exists
        if (item.variantInfo) {
            println(`  ${item.variantInfo}`);
        }

        // Quantity x price = subtotal
        const subtotal = item.price * item.quantity;
        const qtyPrice = `  ${item.quantity}x ${formatCurrency(item.price)}`;
        const subtotalStr = formatCurrency(subtotal);
        const spacesNeeded = CHARS_PER_LINE - qtyPrice.length - subtotalStr.length;
        if (spacesNeeded > 0) {
            println(qtyPrice + " ".repeat(spacesNeeded) + subtotalStr);
        } else {
            println(qtyPrice);
            cmd(...CMD.ALIGN_RIGHT);
            println(subtotalStr);
            cmd(...CMD.ALIGN_LEFT);
        }
    }

    println(line("-"));

    // Total
    cmd(...CMD.BOLD_ON);
    const totalLabel = "TOTAL";
    const totalValue = formatCurrency(data.total);
    const totalSpaces = CHARS_PER_LINE - totalLabel.length - totalValue.length;
    println(totalLabel + " ".repeat(Math.max(1, totalSpaces)) + totalValue);
    cmd(...CMD.BOLD_OFF);

    // Payment details
    println(line("-"));
    const methodLabel = "Bayar";
    const methodValue = data.paymentMethod === "cash" ? "TUNAI" : "QRIS";
    println(padRight(methodLabel, 16) + padLeft(methodValue, 16));

    if (data.paymentMethod === "cash" && data.cashReceived) {
        const cashLabel = "Diterima";
        const cashValue = formatCurrency(data.cashReceived);
        println(padRight(cashLabel, CHARS_PER_LINE - cashValue.length) + cashValue);

        if (data.changeAmount && data.changeAmount > 0) {
            const changeLabel = "Kembalian";
            const changeValue = formatCurrency(data.changeAmount);
            println(padRight(changeLabel, CHARS_PER_LINE - changeValue.length) + changeValue);
        }
    }

    println(line("="));

    // Footer
    cmd(...CMD.ALIGN_CENTER);
    newline();
    println("Terima kasih telah");
    println(`berbelanja di ${data.storeName}!`);
    if (data.receiptFooter) {
        newline();
        for (const footerLine of data.receiptFooter.split("\n")) {
            println(footerLine);
        }
    }
    newline();

    // Feed and cut
    cmd(...CMD.FEED_LINES(4));
    cmd(...CMD.PARTIAL_CUT);

    return new Uint8Array(bytes);
}

export async function printReceipt(data: ReceiptData): Promise<void> {
    if (!isConnected()) {
        throw new Error("Printer tidak terhubung");
    }

    const receiptBytes = buildReceipt(data);
    await writeData(receiptBytes);
}
