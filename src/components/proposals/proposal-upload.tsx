'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ProposalUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  isUploading: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProposalUpload({
  onFileSelect,
  selectedFile,
  isUploading,
}: ProposalUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: { 'application/pdf': ['.pdf'] },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
      disabled: isUploading,
    })

  const rejectionMessage =
    fileRejections.length > 0
      ? fileRejections[0].errors[0]?.code === 'file-too-large'
        ? 'File is too large. Maximum size is 10MB.'
        : fileRejections[0].errors[0]?.code === 'file-invalid-type'
          ? 'Only PDF files are accepted.'
          : 'Invalid file. Please try again.'
      : null

  if (selectedFile) {
    return (
      <div className="rounded-xl border border-moss/30 bg-moss/5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-moss/10">
            <FileText className="size-6 text-moss" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {selectedFile.name}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {formatFileSize(selectedFile.size)} &middot; PDF
            </p>
          </div>
          {isUploading ? (
            <Loader2 className="size-5 animate-spin text-moss" />
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onFileSelect(null)}
              className="text-ink-muted hover:text-red-600"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        {isUploading && (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-moss/20">
              <div className="h-full animate-pulse rounded-full bg-moss transition-all" style={{ width: '60%' }} />
            </div>
            <p className="mt-2 text-center text-xs text-ink-muted">
              Uploading proposal...
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'group cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all',
          isDragActive
            ? 'border-moss bg-moss/5'
            : 'border-champagne/40 bg-paper hover:border-moss/50 hover:bg-moss/5',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'flex size-14 items-center justify-center rounded-full transition-colors',
              isDragActive ? 'bg-moss/20' : 'bg-champagne/10'
            )}
          >
            <Upload
              className={cn(
                'size-6 transition-colors',
                isDragActive ? 'text-moss' : 'text-brass'
              )}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {isDragActive ? 'Drop your PDF here' : 'Drop PDF here or click to browse'}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              PDF only, up to 10MB
            </p>
          </div>
        </div>
      </div>
      {rejectionMessage && (
        <p className="mt-2 text-center text-sm text-red-600">{rejectionMessage}</p>
      )}
    </div>
  )
}
