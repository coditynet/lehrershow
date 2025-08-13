'use client'

import { songFileRouter } from "@/app/api/uploadthing/core"
import { UploadDropzone } from "@/utils/uploadthing";
import { toast } from "sonner";

interface FileUploadProps {
    onChange: (url?: string) => void;
    endpoint: keyof typeof songFileRouter;
}

export const FileUpload = ({
    onChange,
    endpoint
}: FileUploadProps) => {
    return (
        <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
            onChange(res?.[0].ufsUrl);
            console.log(res?.[0].ufsUrl)
        }}
        onUploadError={(error: Error) => {
            toast.error(`${error.message}`)
        }}
        />
    )
} 