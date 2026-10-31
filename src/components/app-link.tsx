import * as React from "react";
import { Link as RouterLink } from "@tanstack/react-router";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** Built pages use client-side navigation; pages planned for later phases use plain links. */
const builtRoutes = new Set([
  "/",
  "/style-guide",
  "/about",
  "/programs",
  "/youth-development",
  "/contact",
  "/support",
  "/support/donate",
  "/support/donate/thank-you",
  "/support/equipment",
  "/support/sponsor",
  "/impact",
  "/events",
  "/news",
  "/gallery",
  "/partners",
]);

/** Routes with one `$slug` segment. The pattern captures the slug and an optional #hash. */
const slugRoutes = [
  { pattern: /^\/programs\/([^/?#]+)(?:#(.*))?$/, to: "/programs/$slug" },
  { pattern: /^\/events\/([^/?#]+)(?:#(.*))?$/, to: "/events/$slug" },
  { pattern: /^\/news\/([^/?#]+)(?:#(.*))?$/, to: "/news/$slug" },
  { pattern: /^\/impact\/talents\/([^/?#]+)(?:#(.*))?$/, to: "/impact/talents/$slug" },
  { pattern: /^\/legal\/([^/?#]+)(?:#(.*))?$/, to: "/legal/$slug" },
] as const;

const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link({ href, ...rest }, ref) {
  for (const route of slugRoutes) {
    const match = route.pattern.exec(href);
    if (match?.[1]) {
      const { target, ...linkRest } = rest;
      return (
        <RouterLink
          ref={ref}
          to={route.to as "/programs/$slug"}
          params={{ slug: decodeURIComponent(match[1]) }}
          {...(match[2] ? { hash: match[2] } : {})}
          {...(target ? { target } : {})}
          {...linkRest}
        />
      );
    }
  }
  // Links with a query string (for example /support/donate?purpose=equipment) stay client-side.
  const queryMatch = /^(\/[^?#]*)\?([^#]*)$/.exec(href);
  if (queryMatch?.[1] && queryMatch[2] !== undefined && builtRoutes.has(queryMatch[1])) {
    const { target, ...linkRest } = rest;
    return (
      <RouterLink
        ref={ref}
        to={queryMatch[1]}
        search={Object.fromEntries(new URLSearchParams(queryMatch[2])) as never}
        {...(target ? { target } : {})}
        {...linkRest}
      />
    );
  }
  if (builtRoutes.has(href)) {
    const { target, ...linkRest } = rest;
    return <RouterLink ref={ref} to={href} {...(target ? { target } : {})} {...linkRest} />;
  }
  return <a ref={ref} href={href} {...rest} />;
});
export default Link;
