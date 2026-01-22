"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ExamEditPageClient from "./ExamEditPageClient";

function EditPageContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    if (!id) {
        return <div className="profile-container">無效的試卷 ID</div>;
    }

    return <ExamEditPageClient id={id} />;
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="profile-container loading-wrapper">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-muted)' }}>載入中...</p>
                </div>
            </div>
        }>
            <EditPageContent />
        </Suspense>
    );
}
