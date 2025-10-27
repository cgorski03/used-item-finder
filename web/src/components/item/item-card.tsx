import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { itemAiAnalysisSelect, itemSelect } from "@db";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

interface ItemCardProps {
    item: itemSelect;
    itemAiAnalysis: itemAiAnalysisSelect | null;
}

export function ItemCard({ item, itemAiAnalysis }: ItemCardProps) {
    if (!item) {
        return <div>Error Loading Item</div>;
    }

    const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: item.priceCurrency,
    }).format(parseFloat(item.priceValue));
    console.log(itemAiAnalysis);
    return (
        <Card
            className={cn(
                "flex flex-col h-[420px] hover:shadow-lg transition-shadow"
            )}
        >
            {/* Item Image */}
            <CardHeader className="p-0">
                <div className="relative h-64 w-full bg-muted overflow-hidden">
                    <Image
                        src={item.primaryImageUrl ?? ""}
                        alt={item.title || "Item image"}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="340px"
                    />
                </div>
            </CardHeader>

            {/* Item Details */}
            <CardContent className="flex-1 p-4 flex flex-col justify-end pb-2">
                <div className="space-y-2">
                    <CardTitle className="text-sm font-medium line-clamp-2 leading-tight">
                        {item.title}
                    </CardTitle>

                    <div className="flex items-baseline justify-between">
                        <span className="text-lg font-semibold">{formattedPrice}</span>
                        {itemAiAnalysis ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 cursor-default">
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                            <Badge
                                                variant="secondary"
                                                className="text-xs bg-amber-50 hover:bg-amber-100"
                                            >
                                                {itemAiAnalysis.score}%
                                            </Badge>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="left"
                                        className="max-w-xs bg-popover border shadow-lg rounded-lg p-3 animate-in fade-in duration-200"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="font-semibold text-sm">AI Analysis Score</p>
                                                <span className="text-xs text-muted-foreground">
                                                    {itemAiAnalysis.score}%
                                                </span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-foreground">
                                                {itemAiAnalysis.imageReasoning || itemAiAnalysis.attributesReasoning}
                                            </p>
                                            <div className="pt-1 border-t">
                                                <p className="text-[10px] text-muted-foreground">
                                                    Analyzed{' '}
                                                    {new Date(itemAiAnalysis.analyzedAt).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <Badge variant="outline" className="text-xs">
                                Not analyzed
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Actions */}
            <CardFooter className="p-4 pt-0">
                <Button asChild variant="outline" className="w-full" size="sm">
                    <Link href={item.url} target="_blank" rel="noopener noreferrer">
                        View Listing
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
