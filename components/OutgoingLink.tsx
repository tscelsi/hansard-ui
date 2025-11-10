import { ArrowUpRight12Filled } from "@fluentui/react-icons";
import { instrumentSans } from "app/fonts";
import clsx from "clsx";

export default function OutgoingLink({
  children,
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        instrumentSans.className,
        className,
        "w-fit inline-flex gap-1 items-center text-link-blue hover:underline hover:opacity-90"
      )}
    >
      {children}
      <ArrowUpRight12Filled />
    </a>
  );
}
