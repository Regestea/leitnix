import { registerPlugin } from "@capacitor/core";

export interface SaveFileResult {
  /** True when the user backed out of the system save dialog. */
  cancelled: boolean;
  /** content:// URI of the file the user chose, when not cancelled. */
  uri?: string;
}

export interface SaveFilePluginProtocol {
  /** Opens the system "Save to..." dialog and copies `srcPath` into it. */
  saveAs(options: {
    srcPath: string;
    fileName: string;
    mimeType?: string;
  }): Promise<SaveFileResult>;
}

/** Android-only native plugin; never call it on web or iOS. */
export const SaveFilePlugin = registerPlugin<SaveFilePluginProtocol>("SaveFile");
