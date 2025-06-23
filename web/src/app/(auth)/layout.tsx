import { Suspense } from "react";
import PublicRoute from "../_components/public-route";


export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PublicRoute>
            <Suspense fallback={
                <div className="w-full bg-gray-900 min-h-screen flex items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
                }>
                {children}
            </Suspense>
        </PublicRoute>
    )
}