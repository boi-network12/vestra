// app/(routes)/layout.tsx

import ProtectedRoute from "../_components/protected-route";


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}