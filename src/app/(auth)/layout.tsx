import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            ProjectFlow
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
