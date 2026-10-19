import React from "react";
import { Sparkles, Users } from "lucide-react";

interface RemoteHeaderProps {
  pin: string | undefined;
  participantsCount: number;
}

export const RemoteHeader: React.FC<RemoteHeaderProps> = ({
  pin,
  participantsCount,
}) => {
  return (
    <header className="flex items-center justify-between py-2 border-b border-[#425563]">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 bg-[#FFC72C] text-[#001E32] rounded-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-lg text-white">
          EPIVOX CONTROL REMOTO
        </span>
      </div>
      <div className="flex items-center space-x-3">
        <span className="font-mono text-sm bg-[#193750] border border-[#FFC72C] text-[#FFC72C] px-3 py-1 rounded-lg font-bold">
          PIN: {pin}
        </span>
        <span className="flex items-center space-x-1 text-xs text-[#ECEBE4]">
          <Users className="w-4 h-4 text-[#48A9C5]" />
          <span>{participantsCount}</span>
        </span>
      </div>
    </header>
  );
};
