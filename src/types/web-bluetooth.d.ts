// Web Bluetooth API type declarations

interface BluetoothDevice {
    readonly id: string;
    readonly name?: string;
    readonly gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: "gattserverdisconnected", listener: EventListener): void;
    removeEventListener(type: "gattserverdisconnected", listener: EventListener): void;
}

interface BluetoothRemoteGATTServer {
    readonly connected: boolean;
    readonly device: BluetoothDevice;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
    readonly properties: BluetoothCharacteristicProperties;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
}

interface BluetoothCharacteristicProperties {
    readonly write: boolean;
    readonly writeWithoutResponse: boolean;
}

interface BluetoothRequestDeviceFilter {
    name?: string;
    namePrefix?: string;
    services?: string[];
}

interface RequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: string[];
    acceptAllDevices?: boolean;
}

interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
}

interface Navigator {
    bluetooth: Bluetooth;
}
