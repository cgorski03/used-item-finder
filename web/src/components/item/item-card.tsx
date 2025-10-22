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
import { ItemList } from "@/trpc/shared";

interface ItemCardProps {
    item: ItemList[number];
}

export function ItemCard({ item }: ItemCardProps) {
    if (!item) {
        return <div>Error Loading Item</div>;
    }

    const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: item.priceCurrency,
    }).format(parseFloat(item.priceValue));

    const conditionDisplay = item.condition ? item.condition : "N/A";
    console.log(item);
    return (
        <Card
            className={cn(
                "w-[340px] overflow-hidden flex flex-col h-[520px] hover:shadow-lg transition-shadow"
            )}
        >
            {/* Item Image */}
            <CardHeader className="p-0">
                <div className="relative h-64 w-full bg-muted overflow-hidden">
                    <Image
                        src={item.primaryImageUrl ?? ""}
                        alt={item.title || "Item image"}
                        width={200}
                        height={300}
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="340px"
                    />
                </div>
            </CardHeader>

            {/* Item Details */}
            <CardContent className="flex-1 p-6 space-y-4">
                <div className="space-y-3">
                    <CardTitle className="text-base font-medium line-clamp-2 leading-snug min-h-[44px]">
                        {item.title}
                    </CardTitle>

                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-semibold">{formattedPrice}</span>
                        <Badge variant="secondary" className="text-xs">
                            {conditionDisplay}
                        </Badge>
                    </div>
                </div>

                {item.sellerUsername && (
                    <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                            {item.sellerUsername}
                        </p>
                    </div>
                )}
            </CardContent>

            {/* Actions */}
            <CardFooter className="p-6 pt-0">
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
