import { Link, LinkProps } from "@tanstack/react-router";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "./ui/navigation-menu.tsx";
import { cn } from "../lib/utils.ts";

type LinkMeta = {
  title: string;
  href: LinkProps["to"];
  description: string;
};
const components: LinkMeta[] = [
  {
    title: "Cost of Living",
    href: "/cost-of-living",
    description:
      "Calculate the cost of living change with tax and itemized expenses.",
  },
  {
    title: "Monete Carlo SWR",
    href: "/monte-carlo-swr",
    description: "Simulate a portfolio with custom funds and withdraw rate.",
  },
  {
    title: "Coast Fire",
    href: "/coast-fire",
    description: "Calculate time until coast fire, and beyond.",
  },
];

export function NavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {components.map((component) => (
                <ListItem key={component.href} {...component} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({ title, href, description }: LinkMeta) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          )}
          to={href}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {description}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
