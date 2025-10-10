"use client"
import React from 'react'
import { trpc } from '@/trpc/react'
import { ItemList } from '@/trpc/shared';
import { ItemCard } from './components/item-card';

export default function ItemsPage() {
  const { data: item, isLoading, isError, error } = trpc.item.getAll.useQuery();
  const items: ItemList = trpc.item.getAll.useQuery().data;

  return (
    <div className="w-full h-full p-4"> {/* Added padding for better aesthetics */}
      <h1 className="text-2xl font-bold mb-6">All Items</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items && items.map((item: ItemList[number]) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
