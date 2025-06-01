"use client";


import { MainLayout } from "@/components/layout/main-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileUploader } from "@/components/upload/file-uploader";

export default function UploadPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Upload</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-6 text-3xl font-bold">Upload Your Creation</h1>

        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload Content</h2>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
