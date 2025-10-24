import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { AppBreadcrumb } from "./app-breadcrumb";

interface PageHeaderProps {
    title: string;
    description?: string;
    backHref?: string;
    backLabel?: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({
    title,
    description,
    backHref,
    backLabel = "Back",
    breadcrumbs,
}: PageHeaderProps) {
    return (
        <div className="space-y-4">
            <AppBreadcrumb customSegments={breadcrumbs} />
            <h1 className="text-3xl font-bold">{title}</h1>
        </div>
    );
}
