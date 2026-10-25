import NewsCard from "@/components/news-card";
import { client } from "@sanity/lib/client";
import { NEWS_QUERY } from "@sanity/lib/queries";
import { urlFor } from "@sanity/lib/image";
import { ScrollView } from "../scroll-view";

type SanityNewsArticle = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string;
  coverImage?: Parameters<typeof urlFor>[0];
};

export default async function NewsSection() {
  const articles = await client.fetch<SanityNewsArticle[]>(NEWS_QUERY);

  const news = articles.map((article) => ({
    name: article.title,
    date: new Date(article.publishedAt).toLocaleDateString("en-GB"),
    description: article.excerpt,
    img: article.coverImage
      ? urlFor(article.coverImage).width(1000).url()
      : "/images/news/test.jpg",
    url: `/news/${article.slug}`,
  }));

  return (
    <section
      className="py-16 md:py-32 bg-gray-50 dark:bg-transparent"
      id="news"
    >
      <div className="mx-auto max-w-5xl space-y-12 px-6">
        {/* Section heading */}
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <ScrollView>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
              Journal
            </span>
          </ScrollView>

          <ScrollView delay={0.1}>
            <h2 className="text-4xl font-medium tracking-tight lg:text-5xl">
              My news{" "}
            </h2>
          </ScrollView>

          <ScrollView delay={0.2}>
            <p className="text-muted-foreground">
              New music, exciting projects, and everything in between.
              <br />
              What&apos;s boiling in the pot?
            </p>
          </ScrollView>
        </div>

        {news.length === 0 ? (
          <ScrollView>
            <div className="flex w-full items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                Stay tuned! New stories and updates are coming soon. 👀
              </p>
            </div>
          </ScrollView>
        ) : (
          <ScrollView delay={0.3}>
            <div className="grid grid-cols-1 gap-20 pt-10 md:grid-cols-2">
              {news.map((item) => (
                <NewsCard key={item.url} card={item} />
              ))}
            </div>
          </ScrollView>
        )}
      </div>
    </section>
  );
}
