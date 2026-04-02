import * as React from "react"

import { LibrarySkeleton } from "@/components/blocks/library-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

interface LibraryTabStateProps {
  isLoading: boolean
  hasData: boolean
  skeletonType: "albums" | "artists" | "tracks"
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyMessage: string
  children: React.ReactNode
}

export function LibraryTabState({
  isLoading,
  hasData,
  skeletonType,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  children,
}: LibraryTabStateProps) {
  if (isLoading) {
    return <LibrarySkeleton type={skeletonType} />
  }

  if (!hasData) {
    return (
      <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
    )
  }

  return <>{children}</>
}
