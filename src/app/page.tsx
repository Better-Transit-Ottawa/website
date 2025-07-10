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

        <a href="https://www.youtube.com/@BetterTransitOttawa">
          <img src="images/youtube.svg" alt="YouTube logo"/>
        </a>
      </div>

      <div className="text-block">
        <p className="info-bar">
          <img className="info-icon" src="images/info.svg" alt="Info icon" />

          <span className="info-bar-title">
            Who We Are
          </span>
        </p>

        <p>
          We are a group of volunteers fighting for a useful, reliable, and sustainable public transportation network in the City of Ottawa
        </p>

        <p>
          We have distilled our mission down to three core principles:
        </p>

        <div className="text-block-indented">
          <p>
            <b>Consistency</b>: Infrastructure projects to ensure transit is on-time, reliable, and offers a competitive alternative to driving
          </p>

          <p>
            <b>Sustainability</b>: Operational changes to maintain a reliable network and support future growth
          </p>

          <p>
            <b>Solidarity</b>: Giving power back to front-line transit workers
          </p>
        </div>
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
            name: "Bank Street Action Group",
            url: "https://www.banktransitaction.ca/",
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