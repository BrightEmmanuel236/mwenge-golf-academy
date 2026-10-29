import Link from "@/components/app-link";
import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import type { NewsPost } from "@/lib/content/types";
import { formatDate } from "@/lib/format";

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <Card className="group hover:shadow-raised relative flex h-full flex-col transition-shadow duration-200">
      <SmartImage
        role="card"
        src={post.image.src}
        source={post.image.source}
        alt={post.image.alt}
        focal={post.image.focal}
      />
      <CardBody className="flex-1">
        <div className="text-slate flex items-center gap-3 text-sm">
          <Badge>{post.category}</Badge>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </div>
        <h3 className="text-xl">
          <Link href={`/news/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="text-slate">{post.excerpt}</p>
      </CardBody>
    </Card>
  );
}
