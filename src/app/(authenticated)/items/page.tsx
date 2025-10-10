"use client"
import React from 'react'
import { trpc } from '@/trpc/react'

export default function ItemsPage() {

  const res = trpc.items.getAll.useQuery();
  return (<div></div>);
}
