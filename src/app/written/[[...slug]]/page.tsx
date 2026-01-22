import WrittenPageClient from "./WrittenPageClient";

// Building only the root entry for written
export async function generateStaticParams() {
    return [{ slug: [] }];
}

export default function Page() {
    return <WrittenPageClient />;
}
