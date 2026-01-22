import OthersPageClient from "./OthersPageClient";

export async function generateStaticParams() {
    return [{ slug: [] }];
}

export default function Page() {
    return <OthersPageClient />;
}
