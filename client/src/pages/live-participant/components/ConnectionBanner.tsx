export function ConnectionBanner({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null;
  return (
    <div className="bg-[#B7312C] text-white text-xs font-bold py-1.5 px-3 rounded-lg text-center shadow-lg animate-pulse my-2">
      Reconectando con la presentación en vivo...
    </div>
  );
}
