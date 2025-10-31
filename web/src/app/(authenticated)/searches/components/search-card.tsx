"use client"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { SearchWithStatsList } from "@/trpc/shared"
import { Button } from "@/components/ui/button"
import { MoreVertical, Package, Pause, Play, Square, TrendingUp } from "lucide-react"

interface SearchCardProps {
    searchWithStats: SearchWithStatsList[number]
    onToggleStatus: (searchId: number, active: boolean) => void;
    isUpdating: boolean;
}

export function SearchCard({ searchWithStats, onToggleStatus }: SearchCardProps) {
    const { search, stats } = searchWithStats;
    const todaysStats = stats && stats.at(-1);
    const status = search.active ? "active" : "paused";
    const source = "eBay"; // TODO
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold leading-none tracking-tight">
                                {search.title}
                            </h3>
                            <Badge
                                variant={search.active ? "default" : "secondary"}
                                className={
                                    search.active
                                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
                                        : ""
                                }
                            >
                                {status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {search.keywords}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Package className="h-4 w-4" />
                        <span>Source: {source}</span>
                    </div>
                    {search.aiEnabled && (
                        <Badge variant="outline" className="text-xs">
                            AI Analysis
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
                    <div className="space-y-1">
                        <p className="text-2xl font-semibold tabular-nums">
                            {todaysStats?.maxItemsFound || "No Data"}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Volume</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-2xl font-semibold tabular-nums">
                                {todaysStats?.newItemsInserted || "No Data"}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">New Today</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2 pt-0">
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/searches/${search.id}`}>View Items</Link>
                </Button>
                <Button variant="ghost" size="icon"
                    onClick={() => onToggleStatus(search.id, !search.active)}>
                    {search.active ? (
                        <>
                            <Square className="h-4 w-4" />
                            <span className="sr-only">Stop search</span>
                        </>
                    ) :
                        (
                            <>
                                <Play className="h-4 w-4" />
                                <span className="sr-only">Stop search</span>
                            </>
                        )}
                </Button>
            </CardFooter>
        </Card>
    );
}
