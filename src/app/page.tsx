import * as React from "react";
import LinkMap from "./components/link-map";
import { Metadata } from "next";

export default function Home() {
  return (
    <div className="content">
      <div className="title">
        <div className="logo">
          <img src="images/logo-square.svg" alt="Logo" />
        </div>

        <div className="title-text">Better Transit Ottawa</div>

        <div className="end-spacer"></div>
      </div>

      <div className="description">
        {`Let's make public transit in Ottawa better`}
      </div>

      <a className="join" href="https://discord.gg/T7HzadcpSX">
        Join us on Discord
      </a>

      <div className="socials">
        <a href="https://bsky.app/profile/bettertransitottawa.ca">
          <img src="images/bluesky.svg" alt="Bluesky logo"/>
        </a>

        <a href="https://www.instagram.com/bettertransitottawa/">
          <img src="images/instagram.svg" alt="Instagram logo"/>
        </a>
      </div>

      <LinkMap
        links={[
          {
            name: "Better Transit Ottawa",
            url: "https://discord.gg/9gQzNpp3QT",
            logo: "images/logo.svg",
          },
          {
            name: "Transit Ottawa Blog",
            url: "https://otransitottawa.blogspot.com/",
          },
          {
            name: "alex-is.online",
            url: "https://alex-is.online/docs",
          },
          {
            name: "yukaira",
            url: "https://www.youtube.com/playlist?list=PL8vl2ZW-HDQwPZL3edNEiA424IPwUWm3y",
          },
          {
            name: "There Was a Station Here Blog",
            url: "https://therewasastationhere.wordpress.com/"
          },
          {
            name: "lennon.transit",
            url: "https://www.instagram.com/lennon.transit/"
          },
          {
            name: "Strong Towns Ottawa",
            url: "https://strongtownsottawa.ca/bank/",
          },
          {
            name: "Ottawa Transit Riders",
            url: "https://www.ottawatransitriders.ca/",
          },
          {
            name: "Free Transit Ottawa",
            url: "https://freetransitottawa.ca/",
          },
        ]}
      />

      Contact: contact[at]bettertransitottawa.ca
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Better Transit Ottawa",
    description: "Let's make public transit in Ottawa better",
    openGraph: {
      description: "Let's make public transit in Ottawa better"
    },
    metadataBase: new URL("https://bettertransitottawa.ca"),
    twitter: {
      card: "summary"
    }
  };
}