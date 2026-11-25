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
     * Compresses bitmap to max 800px dimension and 70% JPEG quality to keep RAM usage minimal.
     * Saves compressed file locally in internal storage and returns the local file path.
     */
    suspend fun compressAndSaveLocalImage(sourceUri: Uri): String = withContext(Dispatchers.IO) {
        val inputStream = context.contentResolver.openInputStream(sourceUri)
        val originalBitmap = BitmapFactory.decodeStream(inputStream)
        inputStream?.close()

        val maxDim = 800
        val width = originalBitmap.width
        val height = originalBitmap.height
        val scale = if (width > maxDim || height > maxDim) {
            val ratio = width.toFloat() / height.toFloat()
            if (ratio > 1) {
                maxDim.toFloat() / width
            } else {
                maxDim.toFloat() / height
            }
        } else 1.0f

        val scaledBitmap = if (scale < 1.0f) {
            Bitmap.createScaledBitmap(
                originalBitmap,
                (width * scale).toInt(),
                (height * scale).toInt(),
                true
            )
        } else {
            originalBitmap
        }

        val filename = "lamma_img_${UUID.randomUUID()}.jpg"
        val destFile = File(mediaDir, filename)

        val outputStream = FileOutputStream(destFile)
        scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 70, outputStream)
        outputStream.flush()
        outputStream.close()

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
