"use client"
"use client";

import { useForm } from "@tanstack/react-form";
import { trpc } from "@/trpc/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function CreateSearchForm({ onSuccess }: { onSuccess?: () => void }) {
    const [showSuccess, setShowSuccess] = useState(false);
    const utils = trpc.useUtils();

    const createSearch = trpc.search.createSearch.useMutation({
        onSuccess: () => {
            utils.search.getUserSearches.invalidate();
            form.reset();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            onSuccess?.();
        },
    });

    const form = useForm({
        defaultValues: {
            keywords: "",
            title: "",
            aiEnabled: false,
            detailedRequirements: "",
            pollInterval: 15,
        },
        onSubmit: async ({ value }) => {
            await createSearch.mutateAsync({
                ...value,
                detailedRequirements:
                    value.detailedRequirements || undefined,
            });
        },
    });

    const presetIntervals = [
        { label: "15 min", value: 15 },
        { label: "30 min", value: 30 },
        { label: "1 hour", value: 60 },
        { label: "6 hours", value: 360 },
    ];

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Search</CardTitle>
                <CardDescription>
                    Set up automated eBay search monitoring
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    {/* Title Field */}
                    <form.Field
                        name="title"
                        validators={{
                            onChange: ({ value }) => {
                                if (!value || value.length < 2) {
                                    return "Title must be at least 2 characters";
                                }
                                if (value.length > 50) {
                                    return "Title must be less than 50 characters";
                                }
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>
                                    Search Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="e.g., Vintage Baseball Cards"
                                    className={
                                        field.state.meta.errors.length > 0
                                            ? "border-destructive"
                                            : ""
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    A descriptive name for this search
                                </p>
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Keywords Field */}
                    <form.Field
                        name="keywords"
                        validators={{
                            onChange: ({ value }) => {
                                if (!value || value.length < 2) {
                                    return "Keywords must be at least 2 characters";
                                }
                                if (value.length > 500) {
                                    return "Keywords must be less than 500 characters";
                                }
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>
                                    Search Keywords <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="e.g., vintage baseball cards, nike shoes size 10"
                                    className={
                                        field.state.meta.errors.length > 0
                                            ? "border-destructive"
                                            : ""
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Keywords to search on eBay
                                </p>
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Poll Interval Field */}
                    <form.Field
                        name="pollInterval"
                        validators={{
                            onChange: ({ value }) => {
                                if (value < 15) return "Miniumum interval is 15 minutes";
                                if (value > 1440)
                                    return "Maximum interval is 24 hours";
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>
                                    Check Interval <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex gap-2 mb-3">
                                    {presetIntervals.map((preset) => (
                                        <Button
                                            key={preset.value}
                                            type="button"
                                            variant={
                                                field.state.value === preset.value
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            onClick={() => field.handleChange(preset.value)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    min="5"
                                    max="1440"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(Number(e.target.value))
                                    }
                                    className={
                                        field.state.meta.errors.length > 0
                                            ? "border-destructive"
                                            : ""
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    How often to check for new listings (in minutes)
                                </p>
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Detailed Requirements Field */}
                    <form.Field
                        name="detailedRequirements"
                        validators={{
                            onChange: ({ value }) => {
                                if (value && value.length > 1000) {
                                    return "Requirements must be less than 1000 characters";
                                }
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>
                                    Detailed Requirements{" "}
                                    <span className="text-muted-foreground">(Optional)</span>
                                </Label>
                                <Textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Describe specific requirements for items you're looking for..."
                                    rows={4}
                                    className={
                                        field.state.meta.errors.length > 0
                                            ? "border-destructive"
                                            : ""
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Additional criteria for AI-powered filtering
                                </p>
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* AI Enabled Toggle */}
                    <form.Field name="aiEnabled">
                        {(field) => (
                            <div className="flex items-start space-x-3 space-y-0">
                                <Checkbox
                                    id={field.name}
                                    checked={field.state.value}
                                    onCheckedChange={(checked) =>
                                        field.handleChange(checked === true)
                                    }
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor={field.name} className="font-medium">
                                        Enable AI Filtering
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Use AI to filter results based on detailed
                                        requirements
                                    </p>
                                </div>
                            </div>
                        )}
                    </form.Field>

                    {/* Error Alert */}
                    {createSearch.error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {createSearch.error.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Alert */}
                    {showSuccess && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>
                                Your search has been created and is now active.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Submit Buttons */}
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    className="flex-1"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Search"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => form.reset()}
                                >
                                    Reset
                                </Button>
                            </div>
                        )}
                    </form.Subscribe>
                </form>
            </CardContent>
        </Card>
    );
}
