import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  type?: 'main' | 'secondary';
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ 
  type = 'main', 
  width = 240, 
  height = 60, 
  className = '' 
}: LogoProps) {
  const src = type === 'main' ? '/logo.png' : '/logo-secondary.png';
  const alt = type === 'main' ? '한양대학교 간호대학 로고' : 'Hanyang University College of Nursing Logo';

  return (
    <Link href="/" className={`inline-block ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{ height: 'auto', width: '100%' }}
        priority={type === 'main'}
      />
    </Link>
  );
}
