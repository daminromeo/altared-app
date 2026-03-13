'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface UploadedFile {
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

interface FileUploadProps {
  accept?: Accept
  maxSize?: number
  maxFiles?: number
  onUpload: (files: File[]) => Promise<void>
  className?: string
  disabled?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  onUpload,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
        progress: 0,
        status: 'pending' as const,
      }))
      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles))
    },
    [maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles: maxFiles - files.length,
      disabled: disabled || uploading,
    })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index]
      if (file.preview) URL.revokeObjectURL(file.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setUploading(true)
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading' as const, progress: 50 } : f
      )
    )

    try {
      await onUpload(pendingFiles.map((f) => f.file))
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'complete' as const, progress: 100 }
            : f
        )
      )
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? {
                ...f,
                status: 'error' as const,
                progress: 0,
                error: 'Upload failed',
              }
            : f
        )
      )
    } finally {
      setUploading(false)
    }
  }

  const hasPending = files.some((f) => f.status === 'pending')

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer',
          isDragActive
            ? 'border-[#8B9F82] bg-[#8B9F82]/5'
            : 'border-[#7A7A7A]/20 bg-[#FAF8F5] hover:border-[#8B9F82]/40',
          (disabled || uploading) && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex size-10 items-center justify-center rounded-lg bg-white ring-1 ring-black/5">
          <Upload className="size-5 text-[#7A7A7A]" />
        </div>
        <p className="mt-3 text-sm font-medium text-[#2D2D2D]">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="mt-1 text-xs text-[#7A7A7A]">
          or click to browse (max {formatFileSize(maxSize)})
        </p>
      </div>

      {/* File rejections */}
      {fileRejections.length > 0 && (
        <div className="rounded-lg bg-red-50 p-3">
          {fileRejections.map(({ file, errors }, i) => (
            <p key={i} className="text-xs text-red-600">
              {file.name}: {errors.map((e) => e.message).join(', ')}
            </p>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-black/5"
            >
              {/* Preview / icon */}
              {uploadFile.preview ? (
                <img
                  src={uploadFile.preview}
                  alt={uploadFile.file.name}
                  className="size-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#FAF8F5]">
                  <FileIcon className="size-5 text-[#7A7A7A]" />
                </div>
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2D2D2D] truncate">
                  {uploadFile.file.name}
                </p>
                <p className="text-xs text-[#7A7A7A]">
                  {formatFileSize(uploadFile.file.size)}
                </p>

                {uploadFile.status === 'uploading' && (
                  <Progress value={uploadFile.progress} className="mt-1.5" />
                )}

                {uploadFile.status === 'error' && (
                  <p className="mt-1 text-xs text-red-600">{uploadFile.error}</p>
                )}
              </div>

              {/* Status / actions */}
              {uploadFile.status === 'complete' ? (
                <CheckCircle2 className="size-5 shrink-0 text-[#8B9F82]" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="shrink-0 text-[#7A7A7A] hover:text-red-600"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}

          {/* Upload button */}
          {hasPending && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
            >
              {uploading ? 'Uploading...' : `Upload ${files.filter((f) => f.status === 'pending').length} file(s)`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
