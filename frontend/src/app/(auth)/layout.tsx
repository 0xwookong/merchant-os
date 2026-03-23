export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[var(--primary-black)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--neon-green)] font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-semibold text-[var(--gray-900)]">
            OSLPay
          </span>
        </div>
        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
