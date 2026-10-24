import { notFound } from "next/navigation";
import Image from "next/image";
import { PortableText } from "next-sanity";

import { client } from "@sanity/lib/client";
import { urlFor } from "@sanity/lib/image";
import { NEWS_ARTICLE_QUERY } from "@sanity/lib/queries";
import { ScrollView } from "@/components/scroll-view";

type NewsArticle = {
  title: string;
  publishedAt: string;
  excerpt?: string;
  coverImage?: Parameters<typeof urlFor>[0];
  body?: any[];
};

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await client.fetch<NewsArticle | null>(NEWS_ARTICLE_QUERY, {
    slug,
  });

  if (!article) {
    notFound();
  }

  return (
    <section
      className="bg-gray-50 py-16 md:py-32 dark:bg-transparent"
      id="article"
    >
      <div className="mx-auto max-w-5xl space-y-12 px-6">
        <article>
          <div className="mx-auto max-w-xl space-y-6 text-center">
            <ScrollView>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
                {new Date(article.publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </ScrollView>

            <ScrollView delay={0.1}>
              <h1 className="text-4xl font-medium tracking-tight lg:text-5xl">
                {article.title}
              </h1>
            </ScrollView>

            {article.excerpt && (
              <ScrollView delay={0.2}>
                <p className="text-muted-foreground">{article.excerpt}</p>
              </ScrollView>
            )}
          </div>

          {article.coverImage && (
            <div className="relative mt-12 mb-12 aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={urlFor(article.coverImage).width(1400).url()}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          )}

          <div className="space-y-5 text-lg leading-8">
            <PortableText
              value={article.body ?? []}
              components={{
                types: {
                  image: ({ value }) => (
                    <div className="relative my-10 w-full">
                      <Image
                        src={urlFor(value).width(1200).url()}
                        alt={value.alt || article.title}
                        width={1200}
                        height={800}
                        sizes="(max-width: 768px) 100vw, 1024px"
                        className="h-auto w-full rounded-lg"
                      />
                    </div>
                  ),
                },
              }}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
