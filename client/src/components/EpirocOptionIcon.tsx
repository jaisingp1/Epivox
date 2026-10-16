export interface EpirocOptionMeta {
  index: number;
  label: string;
  letter: string;
  name: string;
  src: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const EPIROC_OPTION_CONFIGS: EpirocOptionMeta[] = [
  {
    index: 0,
    label: "Opción A",
    letter: "A",
    name: "Perforadora Subterránea",
    src: "/icons/epiroc-rojo-perforadora.svg",
    bgColor: "bg-[#B7312C]",
    borderColor: "border-[#B7312C]",
    textColor: "text-white",
  },
  {
    index: 1,
    label: "Opción B",
    letter: "B",
    name: "Perforadora de Superficie",
    src: "/icons/epiroc-azul-perforadora.svg",
    bgColor: "bg-[#48A9C5]",
    borderColor: "border-[#48A9C5]",
    textColor: "text-[#001E32]",
  },
  {
    index: 2,
    label: "Opción C",
    letter: "C",
    name: "Cargador Subterráneo",
    src: "/icons/epiroc-amarillo-cargador.svg",
    bgColor: "bg-[#FFC72C]",
    borderColor: "border-[#FFC72C]",
    textColor: "text-[#001E32]",
  },
  {
    index: 3,
    label: "Opción D",
    letter: "D",
    name: "Broca y Engranajes",
    src: "/icons/epiroc-verde-broca.svg",
    bgColor: "bg-[#4C8C2B]",
    borderColor: "border-[#4C8C2B]",
    textColor: "text-white",
  },
];

interface EpirocOptionIconProps {
  index: number;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export default function EpirocOptionIcon({
  index,
  className = "",
  size = "md",
}: EpirocOptionIconProps) {
  const safeIdx = Math.max(0, index % EPIROC_OPTION_CONFIGS.length);
  const config = EPIROC_OPTION_CONFIGS[safeIdx];

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }[size];

  return (
    <img
      src={config.src}
      alt={config.name}
      className={`${sizeClasses} shrink-0 object-contain drop-shadow transition-transform ${className}`}
      loading="eager"
    />
  );
}
