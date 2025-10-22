"use client"

import { CreateSearchForm } from "./newSearchForm"

export default function NewSearchPage() {
    const onCompletion = () => {
        console.log('Totally complete');
    }
    return (
        <CreateSearchForm onSuccess={onCompletion} />
    )
}
