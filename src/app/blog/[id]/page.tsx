import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { Metadata } from "next";
import Layout from "@/components/layout";

const postsDirectory = "blog";

interface BlogProps {
  params: Promise<{
    id: string;
  }>;
}

interface PostDetails {
  contentHtml: string;
  title: string;
  date: string;
  description: string;
  thumbnail?: string;
  caption?: string;
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
    .use(html, {
      sanitize: false
    })
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    contentHtml,
    ...matterResult.data,
  } as PostDetails;
}

export default async function Post(p: BlogProps) {
  const postData = await getPostData((await p.params).id);

  return (
    <Layout>
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

        {postData.thumbnail && (
          <img
            className="blog-thumbnail"
            src={postData.thumbnail}
            alt={postData.caption}
          />
        )}

        <div className="blog" dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </div>
    </Layout>
  );
}

export async function generateMetadata(p: BlogProps): Promise<Metadata> {
  const postData = await getPostData((await p.params).id);

  return {
    title: postData.title,
    authors: [{ name: "Better Transit Ottawa" }],
    metadataBase: new URL("https://bettertransitottawa.ca"),
    description: postData.description,
    openGraph: {
      type: "article",
      publishedTime: new Date(postData.date).toISOString(),
      authors: ["Better Transit Ottawa"],
      images: [postData.thumbnail ?? "opengraph-image.png"],
      description: postData.description,
      siteName: "Better Transit Ottawa"
    }
  };
}