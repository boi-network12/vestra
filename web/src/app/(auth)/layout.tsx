import PublicRoute from "../_components/public-route";


export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PublicRoute>
            {children}
        </PublicRoute>
    )
}