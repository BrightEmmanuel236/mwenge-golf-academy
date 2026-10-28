import * as React from "react";
import { Link as RouterLink } from "@tanstack/react-router";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** Built pages use client-side navigation; pages planned for later phases use plain links. */
const builtRoutes = new Set(["/", "/style-guide"]);

const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link({ href, ...rest }, ref) {
  if (builtRoutes.has(href)) {
    return <RouterLink ref={ref} to={href as "/"} {...rest} />;
  }
  return <a ref={ref} href={href} {...rest} />;
});
export default Link;
