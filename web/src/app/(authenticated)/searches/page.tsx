"use client"
import React from 'react'
import { trpc } from '@/trpc/react'
import { SearchList } from '@/trpc/shared';

export default function SearchesGrid() {
    const { data: searches, isLoading, isError, error } =
        trpc.search.getUserSearches.useQuery({ userId: 0 });

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (isError) return <div className="p-4 text-red-600">{error.message}</div>;
    if (!searches?.length) return <div className="p-4">No searches found</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {searches.map((search) => (
                <div key={search.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold truncate">{search.keywords}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${search.active ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                            }`}>
                            {search.active ? '●' : '○'}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                        Every {search.pollIntervalMinutes} minutes
                    </p>

                    {search.lastRunAt && (
                        <p className="text-xs text-gray-500">
                            Last: {new Date(search.lastRunAt).toLocaleString()}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
