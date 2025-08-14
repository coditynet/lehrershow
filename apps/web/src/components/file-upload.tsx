'use client';

import { songFileRouter } from "@/app/api/uploadthing/core";
import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
import { toast } from "sonner";

interface FileUploadProps {
  onChange: (url?: string) => void;
  endpoint: keyof typeof songFileRouter;
}

export const FileUpload = ({ onChange, endpoint }: FileUploadProps) => {
  return (
    <UploadButton
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        const url = res?.[0]?.ufsUrl;
        if (url) {
          onChange(url);
          toast.success("Upload abgeschlossen");
          console.log(url);
        } else {
          onChange(undefined);
        }
      }}
      onUploadError={(error: Error) => {
        toast.error(error.message);
      }}
      className="w-full"
    />
  );
};