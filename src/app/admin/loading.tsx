import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="container mx-auto p-4 space-y-6 max-w-7xl animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" disabled>
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Button>
                <div className="flex-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Content Skeleton (Generic Table/List style) */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-10 w-64" /> {/* Search bar placeholder */}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Table Header */}
                        <div className="flex items-center gap-4 mb-4 border-b pb-2">
                            <Skeleton className="h-4 w-full" />
                        </div>

                        {/* Rows */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 py-3 border-b border-zinc-800/50">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
