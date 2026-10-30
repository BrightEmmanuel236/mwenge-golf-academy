import * as React from "react";
import { Link as RouterLink } from "@tanstack/react-router";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** Built pages use client-side navigation; pages planned for later phases use plain links. */
const builtRoutes = new Set(["/", "/style-guide", "/about", "/programs", "/youth-development"]);
/** Dynamic routes, matched by prefix (for example /programs/<slug>). */
const builtPrefixes = ["/programs/"];

const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link({ href, ...rest }, ref) {
  if (builtRoutes.has(href) || builtPrefixes.some((prefix) => href.startsWith(prefix))) {
    const { target, ...linkRest } = rest;
    return <RouterLink ref={ref} to={href as "/"} {...(target ? { target } : {})} {...linkRest} />;
  }
  return <a ref={ref} href={href} {...rest} />;
});
export default Link;
