"use client"
import React from 'react'
import { trpc } from '@/trpc/react'
import { SearchList } from '@/trpc/shared';
import { SearchCard } from './components/searchCard';

export default function SearchesGrid() {
    const { data: searches, isLoading, isError, error } =
        trpc.search.getUserSearches.useQuery({ userId: 0 });

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (isError) return <div className="p-4 text-red-600">{error.message}</div>;
    if (!searches?.length) return <div className="p-4">No searches found</div>;

    return (<div className="grid gap-4 md:grid-cols-2">
        {searches.map((search) => (
            <SearchCard key={search.id} search={search} />
        ))}
    </div>);
}
