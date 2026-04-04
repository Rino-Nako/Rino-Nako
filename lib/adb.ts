import {
  AdbDaemonWebUsbDeviceManager,
} from "@yume-chan/adb-daemon-webusb";
import {
  Adb,
  AdbDaemonTransport,
} from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import {
  AdbScrcpyClient,
  AdbScrcpyOptions2_4,
} from "@yume-chan/adb-scrcpy";
import {
  Consumable,
  ReadableStream,
} from "@yume-chan/stream-extra";

// Create a singleton manager
const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;

export interface DeviceConnection {
  adb: Adb;
  serial: string;
  name: string;
  model: string;
}

export class WebADB {
  private static instance: WebADB;
  private constructor() {}

  public static getInstance(): WebADB {
    if (!WebADB.instance) {
      WebADB.instance = new WebADB();
    }
    return WebADB.instance;
  }

  public async connect(): Promise<DeviceConnection | null> {
    if (!Manager) {
      alert("WebUSB is not supported in this browser");
      return null;
    }

    try {
      const device = await Manager.requestDevice();
      if (!device) return null;

      const connection = await device.connect();
      
      const credentialStore = new AdbWebCredentialStore();
      const transport = await AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore,
      });

      // Create ADB instance
      const adb = new Adb(transport);

      // Basic info
      const serial = device.serial;
      const name = device.name;
      
      let model = "Android Device";
      try {
        // Try to get the model name using getprop
        // Use the same method as useScrcpy (noneProtocol.spawnWaitText)
        // @ts-ignore
        if (adb.subprocess.noneProtocol) {
             // @ts-ignore
             const output = await adb.subprocess.noneProtocol.spawnWaitText(["getprop", "ro.product.model"]);
             if (output && output.trim()) {
                 model = output.trim();
             }
        }
      } catch (e) {
         console.warn("Failed to get device model:", e);
      }
      
      return {
        adb,
        serial,
        name,
        model 
      };

    } catch (e) {
      console.error("Connection failed:", e);
      throw e;
    }
  }

  public async startScrcpy(adb: Adb): Promise<AdbScrcpyClient<any>> {
    try {
      // 1. Fetch server binary from public directory
      const SERVER_URL = "/scrcpy-server-v2.4";
      const response = await fetch(SERVER_URL);
      if (!response.body) {
        throw new Error("Failed to fetch scrcpy server");
      }

      // Wrap response body in Consumable stream
      const reader = response.body.getReader();
      const stream = new ReadableStream<Consumable<Uint8Array>>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(new Consumable(value));
        },
        async cancel() {
          await reader.cancel();
        }
      });

      // 2. Push server
      await AdbScrcpyClient.pushServer(
        adb,
        stream
      );

      // 3. Start client
      const options = new AdbScrcpyOptions2_4({
        // Default options
      });
      
      const client = await AdbScrcpyClient.start(
        adb,
        "/data/local/tmp/scrcpy-server.jar",
        options
      );

      return client;
    } catch (e) {
      console.error("Failed to start Scrcpy:", e);
      throw e;
    }
  }
}
