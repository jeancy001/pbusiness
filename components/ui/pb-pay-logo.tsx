import Image from "next/image"

interface PBPayLogoProps {
  className?: string
}

export function PBPayLogo({ className = "" }: PBPayLogoProps) {
  return (
    <Image
      src="/pb-pay-logo.png"
      alt="PB-pay"
      width={48}
      height={48}
      className={className}
      priority
    />
  )
}