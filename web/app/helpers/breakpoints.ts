/**
 * JS-side mirror of the breakpoints in app/assets/css/mixins/breakpoints.css.
 * Nothing enforces the two stay in sync — update both together.
 */
export const MBL_BREAKPOINT_DESKTOP_MIN = 1024;

export const MBL_MEDIA_DESKTOP = `(min-width: ${MBL_BREAKPOINT_DESKTOP_MIN}px)`;
