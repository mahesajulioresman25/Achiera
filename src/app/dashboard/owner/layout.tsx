export default async function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Render children directly for this layout
    return (

        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold tracking-tight">ACHIERA <span className="text-blue-400">HOLDING</span></h1>
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Owner Command Center</div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
