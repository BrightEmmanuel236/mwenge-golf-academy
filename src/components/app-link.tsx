import * as React from "react";
import { Link as RouterLink } from "@tanstack/react-router";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** Built pages use client-side navigation; pages planned for later phases use plain links. */
const builtRoutes = new Set(["/", "/style-guide", "/about", "/programs", "/youth-development"]);
const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link({ href, ...rest }, ref) {
  const programMatch = /^\/programs\/([^/?#]+)(?:#(.*))?$/.exec(href);
  if (programMatch?.[1]) {
    const { target, ...linkRest } = rest;
    return (
      <RouterLink
        ref={ref}
        to="/programs/$slug"
        params={{ slug: decodeURIComponent(programMatch[1]) }}
        {...(programMatch[2] ? { hash: programMatch[2] } : {})}
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
