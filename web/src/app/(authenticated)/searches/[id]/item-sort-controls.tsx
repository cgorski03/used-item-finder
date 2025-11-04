"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FilterType } from "@/trpc/routers/item";
import { SortFilterByColumns, SortDirection } from "@db";
import { ArrowDownAZ, ArrowUpAZ, X } from "lucide-react";
import { useState } from "react";


interface ItemSortControlsProps {
    sortColumn: SortFilterByColumns;
    sortDirection: SortDirection;
    filters: FilterType[];
    onUpdateSort: (column: SortFilterByColumns, direction: SortDirection) => void;
    onUpdateFilters: (filters: FilterType[]) => void;
}

export function ItemSortControls({
    sortColumn,
    sortDirection,
    filters,
    onUpdateSort,
    onUpdateFilters,
}: ItemSortControlsProps) {
    const [filterColumn, setFilterColumn] = useState<SortFilterByColumns>('score');
    const [filterOperator, setFilterOperator] = useState<'gt' | 'lt'>('gt');
    const [filterValue, setFilterValue] = useState('');

    const toggleDirection = () => {
        onUpdateSort(sortColumn, sortDirection === 'asc' ? 'desc' : 'asc');
    };

    const addFilter = () => {
        if (!filterValue) return;
        const newFilter = {
            column: filterColumn,
            operator: filterOperator,
            value: filterColumn === 'score' || filterColumn === 'priceValue'
                ? Number(filterValue)
                : filterValue,
        };
        onUpdateFilters([...filters, newFilter as FilterType]);
        setFilterValue('');
    };

    const removeFilter = (index: number) => {
        onUpdateFilters(filters.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                    Sort by:
                </span>

                <Select
                    value={sortColumn}
                    onValueChange={(value) => onUpdateSort(value as SortFilterByColumns, sortDirection)}
                >
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="score">AI Match Score</SelectItem>
                        <SelectItem value="priceValue">Price</SelectItem>
                        <SelectItem value="discoveredAt">Date Listed</SelectItem>
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
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                    Filter:
                </span>

                <Select value={filterColumn} onValueChange={(v) => setFilterColumn(v as SortFilterByColumns)}>
                    <SelectTrigger className="w-[140px] bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="score">AI Match Score</SelectItem>
                        <SelectItem value="priceValue">Price</SelectItem>
                        <SelectItem value="discoveredAt">Date Listed</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterOperator} onValueChange={(v) => setFilterOperator(v as 'gt' | 'lt')}>
                    <SelectTrigger className="w-[100px] bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gt">Greater than</SelectItem>
                        <SelectItem value="lt">Less than</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    type={filterColumn === 'score' || filterColumn === 'priceValue' ? 'number' : 'text'}
                    placeholder="Value"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-[120px]"
                />

                <Button onClick={addFilter} size="sm">
                    Add
                </Button>
            </div>

            {filters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {filters.map((filter, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-background px-3 py-1 rounded">
                            <span className="text-sm">
                                {filter.column} {filter.operator} {String(filter.value)}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFilter(idx)}
                                className="h-4 w-4 p-0"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
