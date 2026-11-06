package com.leitnix.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Opens the system "Save to..." dialog (Storage Access Framework) so the user
 * can store a file in any folder their device offers — Downloads, a folder of
 * their file manager, Drive, etc. — then copies a local file into the chosen
 * destination. Used by the backup flow, which stages the payload in the
 * app-private cache directory first.
 */
@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {

    @PluginMethod
    public void saveAs(PluginCall call) {
        String srcPath = call.getString("srcPath");
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        if (srcPath == null || fileName == null) {
            call.reject("srcPath and fileName are required");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);

        // Open the picker inside the Downloads folder when the device honors
        // the hint; an unsupported hint is silently ignored by DocumentsUI.
        try {
            intent.putExtra(
                DocumentsContract.EXTRA_INITIAL_URI,
                DocumentsContract.buildDocumentUri(
                    "com.android.providers.downloads.documents",
                    "raw:/storage/emulated/0/Download"
                )
            );
        } catch (Exception ignored) {
            // hint is best-effort only
        }

        try {
            startActivityForResult(call, intent, "handleSaveResult");
        } catch (Exception e) {
            call.reject("No storage picker available on this device", e);
        }
    }

    /* Capacitor 8 invokes @ActivityCallback methods reflectively with exactly
     * (PluginCall, ActivityResult) — a (call, Intent, int) signature throws
     * "Wrong number of arguments" on the main thread and crashes the app. */
    @ActivityCallback
    private void handleSaveResult(PluginCall call, ActivityResult result) {
        if (call == null) return; // the activity was destroyed before the picker closed

        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.resolve(new JSObject().put("cancelled", true));
            return;
        }

        Uri dest = data.getData();
        String srcPath = call.getString("srcPath");
        if (srcPath == null) {
            call.reject("Source path missing after picker closed");
            return;
        }
        if (srcPath.startsWith("file:")) {
            srcPath = Uri.parse(srcPath).getPath();
        }

        try (InputStream in = new FileInputStream(new File(srcPath));
             OutputStream out = getContext().getContentResolver().openOutputStream(dest)) {
            if (out == null) {
                call.reject("Chosen destination is not writable");
                return;
            }
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = in.read(buffer)) > 0) {
                out.write(buffer, 0, read);
            }
            out.flush();
            call.resolve(new JSObject().put("cancelled", false).put("uri", dest.toString()));
        } catch (Exception e) {
            call.reject("Failed to write to the chosen destination", e);
        }
    }
}
