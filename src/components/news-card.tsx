import Image from "next/image";
import { CustomCursorElement } from "./custom-cursor-element";
import { ScrollView } from "./scroll-view";

type NewsCardProps = {
  card: {
    name: string;
    date: string;
    description: string;
    img: string;
    url: string;
  };
};

const formatDate = (date: string) => {
  const [day, month, year] = date.split("/").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

export default function NewsCard({ card }: NewsCardProps) {
  return (
    <div>
      <CustomCursorElement
        cursor={<div className="text-zinc-950 text-lg font-medium">Read</div>}
      >
        <ScrollView>
          <div className="group transition-all duration-500 hover:scale-105">
            <a href={card.url} rel="noreferrer">
              {/* News image */}
              <Image
                className="w-full rounded-md object-cover object-top grayscale-25 transition-all duration-500 hover:grayscale-0"
                height={480}
                width={720}
                src={card.img}
                alt={card.name}
              />

              {/* News information */}
              <div className="mt-4 space-y-2">
                {/* Publication date */}
                <time
                  dateTime={card.date.split("/").reverse().join("-")}
                  className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.2em]"
                >
                  {formatDate(card.date)}
                </time>

                {/* News title */}
                <h3 className="text-title text-2xl font-medium">{card.name}</h3>

                {/* News description */}
                <p className="text-muted-foreground">{card.description}</p>
              </div>
            </a>
          </div>
        </ScrollView>
      </CustomCursorElement>
    </div>
  );
}
