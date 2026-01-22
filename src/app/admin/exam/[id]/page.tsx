import ExamEditPageClient from "./ClientPage";

export async function generateStaticParams() {
    return [{ id: 'default' }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ExamEditPageClient id={id} />;
}
