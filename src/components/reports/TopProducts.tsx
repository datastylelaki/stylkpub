
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopProduct {
    name: string;
    sales: number;
    revenue: number;
}

interface TopProductsProps {
    products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
    return (
        <div className="space-y-8">
            {products.map((product, index) => (
                <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{product.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} terjual</p>
                    </div>
                    <div className="ml-auto font-medium">
                        Rp {product.revenue.toLocaleString("id-ID")}
                    </div>
                </div>
            ))}
        </div>
    );
}
