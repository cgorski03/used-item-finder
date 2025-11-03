import { useRouter, useSearchParams } from "next/navigation";
import { SortByColumns, SortDirection } from "@db";
import { useCallback } from "react";

export function useItemSort() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const sortByColumn = (searchParams.get('sortBy') || 'score') as SortByColumns;
    const sortDirectionColumn = (searchParams.get('sortDir') || 'desc') as SortDirection;
    const offset = searchParams.get('offset') || '0';

    const updateSort = useCallback(
        (column: SortByColumns, direction: SortDirection) => {
            const params = new URLSearchParams(searchParams);
            params.set('sortBy', column);
            params.set('sortDir', direction);
            params.set('offset', '0');
            router.push(`?${params.toString()}`);
        },
        [searchParams, router]
    )

    const updateOffset = useCallback(
        (newOffset: number) => {
            const params = new URLSearchParams(searchParams);
            params.set('offset', newOffset.toString());
            router.push(`?${params.toString()}`);
        },
        [searchParams, router]
    )
    return {
        sortByColumn,
        sortDirectionColumn,
        offset,
        updateSort,
        updateOffset
    }

}
