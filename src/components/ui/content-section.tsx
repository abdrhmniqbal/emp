import React, { ReactNode } from "react";
import { SectionTitle } from "@/components/section-title";
import { EmptyState } from "@/components/empty-state";

interface EmptyStateConfig {
    icon: string;
    title: string;
    message: string;
}

interface ContentSectionProps<T> {
    title: string;
    onViewMore?: () => void;
    data: T[];
    renderContent: (data: T[]) => ReactNode;
    emptyState: EmptyStateConfig;
    className?: string;
    titleClassName?: string;
}

export function ContentSection<T>({
    title,
    onViewMore,
    data,
    renderContent,
    emptyState,
    className = "",
    titleClassName = "px-4",
}: ContentSectionProps<T>) {
    return (
        <>
            <SectionTitle
                title={title}
                onViewMore={data.length > 0 ? onViewMore : undefined}
                className={titleClassName}
            />
            {data.length > 0 ? (
                renderContent(data)
            ) : (
                <EmptyState
                    icon={emptyState.icon as any}
                    title={emptyState.title}
                    message={emptyState.message}
                    className={`mb-8 py-8 ${className}`}
                />
            )}
        </>
    );
}
