import Link from "next/link";

export interface LayoutProps {
    children: React.ReactNode;
    footer?: React.ReactNode;
    dontLink?: boolean;
    className?: string;
}


export default function Layout({ children, footer, dontLink, className }: LayoutProps) {
    className ??= "";

    return (
        <>
            <div className="background-container">
                <div className="background"/>
            </div>

            <div className={"content " + className}>
                <Link href="/" className={"title" + (dontLink ? " disabled" : "")}>
                    <div className="logo">
                        <img src="/images/logo-square.svg" alt="Logo" />
                    </div>

                    <div className="title-text">Better Transit Ottawa</div>

                    <div className="end-spacer"></div>
                </Link>
                
                {children}

                <div className="footer">
                    {footer}

                    <div>
                        Contact: contact[at]bettertransitottawa.ca
                    </div>
                    <div>
                        <a href="https://github.com/Better-Transit-Ottawa/website">Website source code</a>
                    </div>
                </div>
            </div>
        </>
    )
}