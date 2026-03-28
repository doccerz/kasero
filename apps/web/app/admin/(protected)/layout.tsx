import AdminNav from '../_components/admin-nav';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-56 bg-slate-900 flex flex-col flex-shrink-0">
                <div className="px-6 py-5 border-b border-slate-700">
                    <span className="text-white font-bold text-lg tracking-tight">Kasero</span>
                    <span className="text-slate-400 text-xs block mt-0.5">Admin</span>
                </div>
                <AdminNav />
                <div className="px-3 py-4 border-t border-slate-700">
                    <form action="/api/auth/logout" method="POST">
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </aside>
            {/* Main content area */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}
