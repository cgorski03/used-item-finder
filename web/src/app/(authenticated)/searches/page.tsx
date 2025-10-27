"use client"
import React from 'react'
import { trpc } from '@/trpc/react'
import { SearchCard } from './components/search-card';

export default function SearchesGrid() {
    const { data: searches, isLoading, isError, error } =
        trpc.search.getUserSearches.useQuery();
    const utils = trpc.useUtils();

    // Define the mutation hook at the top level
    const setSearchStatus = trpc.search.setSearchActive.useMutation({
        onSuccess: () => {
            // Invalidate related queries to refresh data
            utils.search.getUserSearches.invalidate();
        },
        onError: (error) => {
            console.error('Failed to update search status:', error);
        }
    });

    // Create a handler function that uses the mutation
    const handleSearchSetStatus = (searchId: number, active: boolean) => {
        setSearchStatus.mutate({ searchId, active });
    };

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (isError) return <div className="p-4 text-red-600">{error.message}</div>;
    if (!searches?.length) return <div className="p-4">No searches found</div>;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {searches.map((search) => (
                <SearchCard
                    key={search.id}
                    search={search}
                    onToggleStatus={handleSearchSetStatus}
                    isUpdating={setSearchStatus.isPending}
                />
            ))}
        </div>
    );
}
