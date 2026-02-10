export default function Loading() {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/20">
                    <span className="text-3xl font-bold text-black">S</span>
                </div>
                <p className="text-muted-foreground animate-pulse text-sm font-medium">
                    Memuat data...
                </p>
            </div>
        </div>
    );
}
