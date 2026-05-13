import Image from 'next/image';

interface LogoProps {
  type?: 'main' | 'secondary';
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ 
  type = 'main', 
  width = 180, 
  height = 45, 
  className = '' 
}: LogoProps) {
  const src = type === 'main' ? '/logo.png' : '/logo-secondary.png';
  const alt = type === 'main' ? '한양대학교 간호대학 로고' : 'Hanyang University College of Nursing Logo';

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ height: 'auto', objectFit: 'contain' }}
      className={className}
      priority={type === 'main'}
    />
  );
}
