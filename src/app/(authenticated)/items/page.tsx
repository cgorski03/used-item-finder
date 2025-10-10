"use client"
import React from 'react';
import { trpc } from '@/utils/trpc'
import { appRouter } from '@/server/routers/_app';

export default function ItemList() {
  const itemsQuery = trpc.items.getAll.useQuery();

  return (<></>)
}
