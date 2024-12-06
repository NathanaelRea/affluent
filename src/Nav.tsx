import { Outlet, NavLink } from "react-router";
import { cn } from "./lib/utils";

export default function Nav() {
  return (
    <div className="">
      <nav className="bg-gray-800 p-4">
        <div className="flex mx-auto container gap-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn("text-lg font-bold", isActive ? "text-white" : "text-gray-400")
            }
          >
            COL
          </NavLink>
          <NavLink
            to="/monte"
            className={({ isActive }) =>
              cn("text-lg font-bold", isActive ? "text-white" : "text-gray-400")
            }
          >
            SWR
          </NavLink>
          <a className="text-gray-700 text-lg font-bold">
            <s>Portfolio Compare</s>
          </a>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
