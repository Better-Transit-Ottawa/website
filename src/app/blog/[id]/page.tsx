import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import Link from "next/link";
import { Metadata } from "next";

const postsDirectory = "blog";

interface BlogProps {
  params: Promise<{
    id: string;
  }>;
}

interface PostDetails {
  contentHtml: string;
  [key: string]: string;
}

export function generateStaticParams() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((file) => {
    return {
        id: file.replace(/\.md$/, ""),
    };
  });
}

async function getPostData(id: string): Promise<PostDetails> {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    contentHtml,
    ...matterResult.data,
  };
}

export default async function Post(p: BlogProps) {
  const postData = await getPostData((await p.params).id);

  return (
    <div className="content">
      <Link href="/" className="title">
          <div className="logo">
          <img src="/images/logo-square.svg" alt="Logo" />
          </div>

          <div className="title-text">Better Transit Ottawa</div>

          <div className="end-spacer"></div>
      </Link>

      <div className="text-block">
        <p className="info-bar">
          <img className="info-icon" src="/images/info.svg" alt="Info icon" />

          <span className="info-bar-title">
            {postData.title}
          </span>
        </p>

        <div className="date">
          {postData.date}
        </div>

        <div className="blog" dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </div>
    </div>
  );
}

export async function generateMetadata(p: BlogProps): Promise<Metadata> {
  const postData = await getPostData((await p.params).id);

  return {
    title: postData.title,
    authors: [{ name: "Better Transit Ottawa" }],
    metadataBase: new URL("https://bettertransitottawa.ca"),
    openGraph: {
      type: "article",
      publishedTime: new Date(postData.date).toISOString(),
      images: ["opengraph-image.png"]
    }
  };
}