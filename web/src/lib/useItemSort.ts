import { useRouter, useSearchParams } from "next/navigation";
import { SortFilterByColumns, SortDirection } from "@db";
import { useCallback } from "react";
import { FilterType } from "@/trpc/routers/item";

export function useItemSort() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const sortByColumn = (searchParams.get('sortBy') || 'score') as SortFilterByColumns;
    const sortDirectionColumn = (searchParams.get('sortDir') || 'desc') as SortDirection;
    const offset = searchParams.get('offset') || '0';

    const filters: FilterType[] = searchParams.get('filterBy')
        ? JSON.parse(decodeURIComponent(searchParams.get('filterBy')!))
        : [];
    console.log(filters);

    const updateSort = useCallback(
        (column: SortFilterByColumns, direction: SortDirection) => {
            const params = new URLSearchParams(searchParams);
            params.set('sortBy', column);
            params.set('sortDir', direction);
            params.set('offset', '0');
            router.push(`?${params.toString()}`);
        },
        [searchParams, router]
    )

    const updateFilters = useCallback(
        (newFilters: FilterType[]) => {
            const params = new URLSearchParams(searchParams);
            params.set('filterBy', encodeURIComponent(JSON.stringify(newFilters)));
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
        filters,
        updateFilters,
        updateSort,
        updateOffset
    }

}
