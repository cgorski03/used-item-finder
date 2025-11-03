"use client"
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SortByColumns, SortDirection } from "@db";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";


interface ItemSortControlsProps {
    sortColumn: SortByColumns;
    sortDirection: SortDirection;
    onUpdateSort: (column: SortByColumns, direction: SortDirection) => void;
}

export function ItemSortControls({
    sortColumn,
    sortDirection,
    onUpdateSort,
}: ItemSortControlsProps) {
    const toggleDirection = () => {
        onUpdateSort(sortColumn, sortDirection === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <span className="text-sm font-medium text-muted-foreground">
                Sort by:
            </span>

            <Select
                value={sortColumn}
                onValueChange={(value) => onUpdateSort(value as SortByColumns, sortDirection)}
            >
                <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="score">AI Match Score</SelectItem>
                    <SelectItem value="priceValue">Price</SelectItem>
                    <SelectItem value="itemCreationDate">Date Listed</SelectItem>
                </SelectContent>
            </Select>

            <Button
                variant="outline"
                size="icon"
                onClick={toggleDirection}
                className="shrink-0"
            >
                {sortDirection === 'desc' ? (
                    <ArrowDownAZ className="h-4 w-4" />
                ) : (
                    <ArrowUpAZ className="h-4 w-4" />
                )}
                <span className="sr-only">
                    {sortDirection === 'desc' ? 'Descending' : 'Ascending'}
                </span>
            </Button>
        </div>
    );
}
