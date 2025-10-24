"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";

interface BreadcrumbSegment {
    label: string;
    href?: string;
}

interface AppBreadcrumbProps {
    segments?: BreadcrumbSegment[];
    customSegments?: BreadcrumbSegment[];
}

export function AppBreadcrumb({ segments, customSegments }: AppBreadcrumbProps) {
    const pathname = usePathname();

    // Auto-generate from pathname if no custom segments
    const breadcrumbs = customSegments || segments || generateFromPath(pathname);

    if (breadcrumbs.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbs.map((segment, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <Fragment key={segment.href || segment.label}>
                            <BreadcrumbItem>
                                {isLast || !segment.href ? (
                                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={segment.href}>{segment.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

// Auto-generate breadcrumbs from pathname
function generateFromPath(pathname: string): BreadcrumbSegment[] {
    const segments = pathname.split("/").filter(Boolean);

    const pathMap: Record<string, string> = {
        searches: "My Searches",
        search: "Search",
        items: "Items",
        saved: "Saved Items",
        analytics: "Analytics",
        settings: "Settings",
    };

    return segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = pathMap[segment] || capitalize(segment);

        return { label, href };
    });
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
