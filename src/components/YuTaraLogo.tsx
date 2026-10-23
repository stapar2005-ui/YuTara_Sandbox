import Image from "next/image";

export function YuTaraLogo({ priority = false }: { priority?: boolean }) {
  return <Image className="brand-logo" src="/yutara-logo.svg" alt="YuTara" width={132} height={39} priority={priority} />;
}
