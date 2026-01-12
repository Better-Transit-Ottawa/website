import { JSX } from "react";
import Image from 'next/image';

export interface Link {
  name: string;
  url?: string;
  logo?: string;
}

export interface LinkMapProps {
  links: Link[];
}

export default function LinkMap({ links }: LinkMapProps) {
  return (
    <section className="webring">
      <h2 className="webring-title">Other Resources</h2>

      <div className="webring-contents">
        <div className="webring-contents-inner">
          <Image className="arrow-down" src="/images/arrow.svg" alt="Down arrow" />

          <div className="line"></div>

          {getLinkElements(links)}
        </div>
      </div>
    </section>
  );
}

function getLinkElements(links: Link[]) {
  const linkElements: JSX.Element[] = [];

  for (let i = 0; i < links.length; i++) {
    linkElements.push(<LinkText key={i} link={links[i]} start={i === 0} />);
  }

  return linkElements;
}

interface LinkTextProps {
  link: Link;
  start: boolean;
}

function LinkText({ link, start }: LinkTextProps) {
  return (
    <div className="linkmap-top">
      <Image
        className="station-dot"
        src="/images/station-dot.svg"
        alt="Station Dot"
      />{" "}
      <span className={"linkmap-text" + (start ? " start-station" : "")}>
        {link.url ? (
          <a href={link.url} target="_blank">
            {link.name}
          </a>
        ) : (
          link.name
        )}
      </span>{" "}
      {link.logo && <Image className="station-logo" src={link.logo} alt="Logo" />}
    </div>
  );
}
