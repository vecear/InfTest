import PracticalPageClient from "./PracticalPageClient";

export async function generateStaticParams() {
    return [{ slug: [] }];
}

export default function Page() {
    return <PracticalPageClient />;
}
