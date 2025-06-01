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
import { PreviewDisplay } from "@/components/upload/preview-display";
import { PublishForm } from "@/components/upload/publish-form";
import { useParams } from "next/navigation";

export default function PreviewPage() {
  const params = useParams();
  const previewId = params.id as string;

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
              <BreadcrumbLink href="/upload">Upload</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Preview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-6 text-3xl font-bold">Preview & Publish</h1>

        <PreviewDisplay previewId={previewId} />
        <PublishForm previewId={previewId} />
      </div>
    </MainLayout>
  );
}
