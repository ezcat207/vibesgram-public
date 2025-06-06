/**
 * Helper function: read file as base64
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Check for parts and use empty string as fallback
      const parts = result.split(",");
      // Explicitly tell TypeScript this returns a string
      const base64Content = parts[1] ?? "";
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Wraps HTML content in a full HTML document structure if needed
 */
export const wrapHtmlContent = (htmlContent: string): string => {
  if (htmlContent.includes("<html")) {
    return htmlContent; // Already a complete HTML document
  }

  // If no html tag, wrap with full document structure
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Share Your Vibe Coding with the World - A creation hosted on Binbody, the digital gallery for vibe coders.">
  <meta name="keywords" content="binbody, coding, vibe, html, web, creative coding">
  <meta property="og:title" content="Binbody Creation">
  <meta property="og:description" content="Share Your Vibe Coding with the World">
  <meta property="og:type" content="website">
  <title>Binbody Creation | Share Your Vibe Coding</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      margin: 0;
      padding: 0;
    }
    .binbody-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 10px 16px;
      background: linear-gradient(90deg, rgba(185,103,255,0.95) 0%, rgba(1,205,254,0.95) 100%);
      backdrop-filter: blur(10px);
      font-size: 14px;
      text-align: center;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      z-index: 1000;
      box-shadow: 0 -4px 20px rgba(185,103,255,0.3);
    }
    .binbody-footer a {
      color: #fffb96;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .binbody-footer a:hover {
      color: white;
      text-shadow: 0 0 8px rgba(255,251,150,0.8);
    }
    .binbody-footer .divider {
      display: inline-block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.7);
      margin: 0 4px;
    }
    @media (prefers-color-scheme: dark) {
      .binbody-footer {
        background: linear-gradient(90deg, rgba(185,103,255,0.9) 0%, rgba(1,205,254,0.9) 100%);
      }
      .binbody-footer a {
        color: #fffb96;
      }
    }
  </style>
</head>
<body>
${htmlContent}
<div class="binbody-footer">
  <span>Created on</span>
  <a href="https://binbody.com" target="_blank" rel="noopener noreferrer">Binbody</a>
  <span class="divider"></span>
  <span>Vibe coder's digital gallery</span>
</div>
</body>
</html>`;
};

/**
 * Creates a preview file array from uploaded files
 */
export const createPreviewFilesFromUpload = async (
  files: File[],
): Promise<PreviewFile[]> => {
  const previewFiles: PreviewFile[] = [];

  for (const file of files) {
    const content = await readFileAsBase64(file);
    // If using webkitdirectory, the path will include the folder name
    // We want to use the folder's contents as root, so we remove the folder name from the path
    const path = file.webkitRelativePath
      ? file.webkitRelativePath.split('/').slice(1).join('/') // Remove the first part (folder name)
      : file.name;

    previewFiles.push({
      path,
      content,
      contentType: file.type || "text/html",
    });
  }

  return previewFiles;
};

/**
 * Creates a preview file from pasted HTML content
 */
export const createPreviewFileFromHtml = (htmlContent: string): PreviewFile => {
  const finalHtmlContent = wrapHtmlContent(htmlContent);
  // Convert string to UTF-8 bytes, then to base64
  const encoder = new TextEncoder();
  const bytes = encoder.encode(finalHtmlContent);
  const base64Content = btoa(String.fromCharCode(...bytes));

  return {
    path: "index.html",
    content: base64Content,
    contentType: "text/html",
  };
};

export interface PreviewFile {
  path: string;
  content: string;
  contentType: string;
}
