import * as React from "react";

/** Hidden from people and assistive technology; bots tend to fill it. Server-side check comes later. */
export function Honeypot({ onChange }: { onChange: React.ChangeEventHandler<HTMLInputElement> }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" onChange={onChange} />
      </label>
    </div>
  );
}
