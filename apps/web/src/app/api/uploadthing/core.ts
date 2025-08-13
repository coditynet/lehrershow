import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();


// FileRouter for your app, can contain multiple FileRoutes
export const songFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    songUploader: f({
        "audio/mpeg": {
            /**
           * For full list of options and defaults, see the File Route API reference
           * @see https://docs.uploadthing.com/file-routes#route-config
           */
            maxFileSize: "16MB",
            maxFileCount: 1,
        }
    })
        // Set permissions and file types for this FileRoute
        .middleware(async ({ req }) => {
            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return { success: true };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Upload complete ");

            console.log("file url", file.ufsUrl);

            // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof songFileRouter;
