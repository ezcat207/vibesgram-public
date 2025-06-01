
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return {
        title: `Preview ${id} - Vibesgram, share your vibe coding with the world`,
        description: `Deploy your code and get a shareable link - Vibesgram is vibe coder's digital gallery`,
        alternates: {
            canonical: `https://vibesgram.com/upload/preview/${id}`
        },
    };
}



export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <>{children}</>;
}

