import type { SVGProps } from 'react';

/** Material icon paths (Apache 2.0) for the icon names used in specs. */
const ICON_PATHS = {
  Edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  Delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  Check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  Close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
} as const;

export type IconName = keyof typeof ICON_PATHS;

/**
 * Knock-out circle drawn around the 24x24 glyph box: centre (12, 12), radius 16, so the glyph spans 75% of the
 * circle's diameter. Used with `fill-rule="evenodd"` in ONE path, the glyph area is a hole (transparent), not paint.
 */
const KNOCKOUT_CIRCLE_PATH = 'M12-4a16 16 0 1 0 0 32a16 16 0 1 0 0-32Z';
const KNOCKOUT_VIEWBOX = '-4 -4 32 32';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number | string;
  /**
   * `circle`: draw a filled circle in `currentColor` with the glyph cut out of it (transparent), so whatever sits
   * behind the icon (row / surface background) shows through the glyph shape. `size` is the circle diameter.
   */
  knockout?: 'circle';
}

export function Icon({ name, size = '1.8rem', knockout, ...rest }: IconProps) {
  if (knockout === 'circle') {
    return (
      <svg
        viewBox={KNOCKOUT_VIEWBOX}
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden
        focusable="false"
        data-icon={name}
        data-icon-knockout="circle"
        {...rest}
      >
        <path fillRule="evenodd" clipRule="evenodd" d={`${KNOCKOUT_CIRCLE_PATH}${ICON_PATHS[name]}`} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      focusable="false"
      data-icon={name}
      {...rest}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
