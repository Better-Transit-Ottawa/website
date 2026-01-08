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
  photoCredit?: string[];
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

async function processCredit(credit: string): Promise<string> {
  const processedContent = await remark()
    .use(html, {
      sanitize: false
    })
    .process(credit);
  const contentHtml = processedContent.toString();

  return contentHtml;
}

export default async function Post(p: BlogProps) {
  const postData = await getPostData((await p.params).id);

  const credits = postData.photoCredit ? await Promise.all(postData.photoCredit.map(async (credit, index) => (
    <div key={index} dangerouslySetInnerHTML={{ __html: await processCredit(credit) }}>
    </div>
  ))) : [];

  return (
    <Layout footer={
      <>
          {credits}
      </>
    }>
      <section className="text-block">

        <h2 className="info-bar">
          <img className="info-icon" src="/images/info.svg" alt="Info icon" />

          <span className="info-bar-title">
            {postData.title}
          </span>
        </h2>
        <article className="blog-article">
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
        </article>
      </section>
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