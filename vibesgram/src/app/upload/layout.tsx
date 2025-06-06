import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Upload Page - Binbody, share your vibe coding with the world",
    description: "Binbody Upload Page",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
    alternates: {
        canonical: "https://binbody.com/upload"
    },
};

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <>{children}</>;
}

