import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Upload Page - Vibesgram, share your vibe coding with the world",
    description: "Vibesgram Upload Page",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
    alternates: {
        canonical: "https://vibesgram.com/upload"
    },
};

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <>{children}</>;
}

