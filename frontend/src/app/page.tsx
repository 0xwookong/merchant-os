export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary-black)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--neon-green)] font-bold text-lg">O</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">
            OSLPay Merchant Portal
          </h1>
        </div>
        <p className="text-sm text-[var(--gray-500)]">
          Platform is running. Development in progress.
        </p>
      </div>
    </div>
  );
}
