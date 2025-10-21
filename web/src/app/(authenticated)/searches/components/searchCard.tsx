"use client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { SearchList } from "@/trpc/shared"

interface SearchCardProps {
    search: SearchList[number]
}

export function SearchCard({ search }: SearchCardProps) {
    return (
        <Link href={`/search/${search.id}`}>
            <Card className="border-border bg-card p-6 hover:bg-muted/50 transition-colors">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">
                            Search #{search.id}
                        </h3>
                        <Badge
                            variant={search.active ? "default" : "secondary"}
                            className={
                                search.active
                                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    : ""
                            }
                        >
                            {search.active ? "active" : "paused"}
                        </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{search.keywords}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created {search.createdAt.toLocaleDateString()}</span>
                        {search.lastRunAt && (
                            <span>Last run {search.lastRunAt.toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
