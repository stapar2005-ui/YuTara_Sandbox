import Image from "next/image";

export function YuTaraLogo({ priority = false }: { priority?: boolean }) {
  return <Image className="brand-logo brand-logo-large" src="/yutara-logo.svg" alt="YuTara" width={160} height={48} priority={priority} />;
}
