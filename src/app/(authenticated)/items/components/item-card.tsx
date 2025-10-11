import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ItemList } from '@/trpc/shared';
interface ItemCardProps {
  item: ItemList[number];
}

export function ItemCard({ item }: ItemCardProps) {
  // Format price
  if (!item) {
    return <div>Error Loading Item</div>
  }
  const formattedPrice = new Intl.NumberFormat('en-US', { // Adjust locale as needed
    style: 'currency',
    currency: item.priceCurrency,
  }).format(parseFloat(item.priceValue));

  const conditionDisplay = item.condition ? item.condition : 'N/A';

  return (
    <Card className={cn("w-[320px] overflow-hidden flex flex-col")}>
      {/* Item Image */}
      <CardHeader className="p-0">
        {item.primaryImageUrl ? (
          <div className="relative h-48 w-full bg-muted-foreground/20 overflow-hidden">
            <Image
              src={item.primaryImageUrl}
              alt={item.title || "Item image"}
              width={200}
              height={200}
              className="object-cover mx-auto transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority // For the first few items, consider loading them faster
            />
          </div>
        ) : (
          <div className="h-48 w-full flex items-center justify-center bg-gray-200 text-gray-500">
            No Image
          </div>
        )}
      </CardHeader>

      {/* Item Details */}
      <CardContent className="flex-1 p-4 space-y-2">
        <CardTitle className="text-lg font-semibold line-clamp-2 min-h-[56px]">
          {item.title}
        </CardTitle>
        <CardDescription>
          <span className="text-xl font-bold text-primary">{formattedPrice}</span>
        </CardDescription>

        <div className="flex items-center text-sm text-muted-foreground">
          <Tag className="h-4 w-4 mr-1" />
          <span>Condition: {conditionDisplay}</span>
        </div>

        {item.sellerUsername && (
          <div className="text-sm text-muted-foreground">
            Seller: <span className="font-medium text-foreground">{item.sellerUsername}</span>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={item.url} target="_blank" rel="noopener noreferrer">
            View Item
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
