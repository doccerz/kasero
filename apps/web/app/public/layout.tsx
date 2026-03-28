export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="mb-6 text-center">
                    <span className="text-xl font-bold tracking-tight text-slate-800">Kasero</span>
                </div>
                {children}
            </div>
        </div>
    );
}
