import { Suspense } from "react";
import PublicRoute from "../_components/public-route";


export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PublicRoute>
            <Suspense fallback={<div>Loading...</div>}>
               {children}
            </Suspense>
        </PublicRoute>
    )
}