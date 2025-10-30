import * as Tooltip from "@radix-ui/react-tooltip";

export default ({
  children,
  trigger,
}: {
  children: React.ReactNode;
  trigger: React.ReactNode;
}) => (
  <Tooltip.Provider delayDuration={100} skipDelayDuration={100}>
    <Tooltip.Root>
      <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content>
          <div className="bg-dark-bg border border-dark-grey text-sm rounded-md p-2 max-w-xs">
            {children}
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);
