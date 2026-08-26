import Image from "next/image";

// Renders both logo variants and lets CSS (driven by the data-theme
// attribute set before paint — see app/layout.tsx) pick the right one.
// Avoids any client-side flicker or hydration mismatch.
export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <>
      <Image
        src="/revena-logo.png"
        alt="Revena Media"
        width={1398}
        height={600}
        priority
        className={`logo-dark ${className}`}
      />
      <Image
        src="/revena-logo-light.png"
        alt="Revena Media"
        width={352}
        height={154}
        priority
        className={`logo-light ${className}`}
      />
    </>
  );
}
