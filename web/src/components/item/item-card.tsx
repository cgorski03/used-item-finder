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
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemListDto } from "@/trpc/shared";
import { itemAiAnalysisSelect, itemSelect } from "@db";

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
                        <Badge variant="secondary" className="text-xs">
                            {itemAiAnalysis?.score}
                        </Badge>
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
