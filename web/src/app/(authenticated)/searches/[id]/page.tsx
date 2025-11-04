"use client"
import { ItemCard } from "@/components/item/item-card";
import { PageHeader } from "@/components/layout/page-header";
import { useItemSort } from "@/lib/useItemSort";
import { trpc } from "@/trpc/react"
import { use } from "react";
import { ItemSortControls } from "./item-sort-controls";

const parseSearchId = (id: string) => {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
        console.error(`invalid id string ${parsedId}`);
        return -1;
    }
    return parsedId;
}
export default function SearchItemsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { sortByColumn,
        updateSort,
        sortDirectionColumn,
        updateOffset,
        filters,
        updateFilters
    } = useItemSort()

    const searchId = parseSearchId(id);
    if (searchId === -1) {
        return (
            <div>
                Search ID does not exist
            </div>
        )
    }
    const { data: search, isLoading: searchLoading, isError: searchIsError, error: searchError } = trpc.search.getSearchById.useQuery({ id: searchId });
    const { data: itemData, isLoading, isError, error } = trpc.item.getBySearchId.useQuery({
        searchId,
        limit: 25,
        offset: 0,
        orderBy: {
            column: sortByColumn,
            direction: sortDirectionColumn
        },
        filterBy: filters
    })

    return (
        <div className="w-full " >
            <PageHeader
                title={search?.title ?? "Loading"}
                description="Items found matching your search criteria"
                backHref="/searches"
                breadcrumbs={[
                    { label: "My Searches", href: "/searches" },
                    { label: search?.title ?? "Loading" },
                ]}
            />
            <div className="p-4" >
                <ItemSortControls
                    sortColumn={sortByColumn}
                    sortDirection={sortDirectionColumn}
                    onUpdateSort={updateSort}
                    onUpdateFilters={updateFilters}
                    filters={filters}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xxl:grid-cols-6">
                    {itemData?.items && itemData.items.map((itemDto) => {
                        const { item, itemAiAnalysis } = itemDto;

                        return <ItemCard key={item.id} item={item} itemAiAnalysis={itemAiAnalysis} />
                    }
                    )}
                </div>
            </div>
        </div >
    );
}
