import Image from "next/image";

type SingleArtworkProps = {
  artworkUrl: string;
  title: string;
};

export default function SingleArtwork({
  artworkUrl,
  title,
}: SingleArtworkProps) {
  return (
    <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-xl">
      <Image
        src={artworkUrl}
        alt={`${title} cover artwork`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 380px, 240px"
        className="object-cover"
      />
    </div>
  );
}
