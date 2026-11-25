package com.lamma.app.data.local

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

class MediaManager(private val context: Context) {

    private val mediaDir: File
        get() = File(context.filesDir, "lamma_media").apply {
            if (!exists()) mkdirs()
        }

    /**
     * Memory-safe image compression for low-end devices:
     * - Uses inJustDecodeBounds to calculate inSampleSize before decoding (prevents heap OOM).
     * - Decodes with RGB_565 (2 bytes/pixel instead of 4) to cut RAM allocation by 50%.
     * - Scales to max 800px and saves locally as 70% JPEG.
     */
    suspend fun compressAndSaveLocalImage(sourceUri: Uri): String = withContext(Dispatchers.IO) {
        val maxDim = 800

        // 1. Read image bounds without allocating pixel memory
        val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(sourceUri)?.use { stream ->
            BitmapFactory.decodeStream(stream, null, boundsOptions)
        }

        val origWidth = boundsOptions.outWidth
        val origHeight = boundsOptions.outHeight
        if (origWidth <= 0 || origHeight <= 0) return@withContext ""

        // 2. Compute inSampleSize power-of-two downsampling
        var sampleSize = 1
        while (origWidth / (sampleSize * 2) >= maxDim && origHeight / (sampleSize * 2) >= maxDim) {
            sampleSize *= 2
        }

        // 3. Decode downsampled bitmap using RGB_565 to minimize heap footprint
        val decodeOptions = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
            inPreferredConfig = Bitmap.Config.RGB_565
        }

        val sampledBitmap = context.contentResolver.openInputStream(sourceUri)?.use { stream ->
            BitmapFactory.decodeStream(stream, null, decodeOptions)
        } ?: return@withContext ""

        // 4. Exact downscale to maxDim if still larger
        val finalBitmap = if (sampledBitmap.width > maxDim || sampledBitmap.height > maxDim) {
            val scale = maxDim.toFloat() / maxOf(sampledBitmap.width, sampledBitmap.height)
            Bitmap.createScaledBitmap(
                sampledBitmap,
                (sampledBitmap.width * scale).toInt(),
                (sampledBitmap.height * scale).toInt(),
                true
            ).also { if (it != sampledBitmap) sampledBitmap.recycle() }
        } else {
            sampledBitmap
        }

        val filename = "lamma_img_${UUID.randomUUID()}.jpg"
        val destFile = File(mediaDir, filename)

        FileOutputStream(destFile).use { out ->
            finalBitmap.compress(Bitmap.CompressFormat.JPEG, 70, out)
            out.flush()
        }
        finalBitmap.recycle()

        destFile.absolutePath
    }

    /**
     * Saves an image from local storage into Android MediaStore (Gallery / Studio)
     */
    suspend fun saveImageToGallery(filePath: String): Boolean = withContext(Dispatchers.IO) {
        val file = File(filePath)
        if (!file.exists()) return@withContext false

        val bitmap = BitmapFactory.decodeFile(file.absolutePath) ?: return@withContext false

        val filename = "Lamma_${System.currentTimeMillis()}.jpg"
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
            put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Lamma")
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
        }

        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues) ?: return@withContext false

        try {
            resolver.openOutputStream(uri)?.use { stream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, stream)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                contentValues.clear()
                contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(uri, contentValues, null, null)
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Returns count of locally cached media files
     */
    fun getCachedMediaCount(): Int {
        return mediaDir.listFiles()?.size ?: 0
    }

    /**
     * Clears internal photo cache to preserve device storage
     */
    suspend fun clearMediaCache(): Boolean = withContext(Dispatchers.IO) {
        try {
            mediaDir.listFiles()?.forEach { it.delete() }
            true
        } catch (e: Exception) {
            false
        }
    }
}
