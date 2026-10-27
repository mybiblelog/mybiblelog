import type { ComponentType } from "react";
import { screen } from "@testing-library/react-native";
import type { Fiber, TestInstance } from "test-renderer";

/** A rendered component element: the props it was rendered with. */
export type ComponentMatch = { props: Record<string, any> };

/**
 * Finds every rendered element of a given component type under `scope`
 * (default: the whole screen). RNTL v14's Test Renderer only exposes host
 * elements, so the removed `UNSAFE_getAllByType` has no public replacement;
 * this walks the scope's committed fiber subtree instead. Use it only where the props
 * under test exist solely on a composite (an icon's `name`, an SVG `fill`
 * before native color processing) — prefer the standard queries otherwise.
 */
export function getAllByComponentType(
  type: ComponentType<any>,
  scope: TestInstance = screen.container
): ComponentMatch[] {
  const matches: ComponentMatch[] = [];
  const collect = (fiber: Fiber) => {
    if (fiber.type === type) matches.push({ props: fiber.memoizedProps });
    for (let child = fiber.child; child; child = child.sibling) collect(child);
  };
  // A TestInstance may hold either of a fiber's two alternates, and the stale
  // one's child links predate the latest commit. So walk the committed tree
  // from the fiber root, starting at the scope's fiber found within it. (The
  // `container` pseudo-element has no fiber: it scopes to the whole tree.)
  const scopeFiber = scope.unstable_fiber;
  let anyFiber = scopeFiber;
  if (!anyFiber) {
    const child = scope.children.find((c): c is TestInstance => typeof c !== "string");
    anyFiber = child?.unstable_fiber ?? null;
  }
  while (anyFiber?.return) anyFiber = anyFiber.return;
  const current: Fiber | undefined = anyFiber?.stateNode?.current;
  if (!current) return matches;
  if (!scopeFiber) {
    collect(current);
    return matches;
  }
  const findScope = (fiber: Fiber): Fiber | null => {
    if (fiber === scopeFiber || fiber.alternate === scopeFiber) return fiber;
    for (let child = fiber.child; child; child = child.sibling) {
      const found = findScope(child);
      if (found) return found;
    }
    return null;
  };
  const scopeRoot = findScope(current);
  if (scopeRoot) collect(scopeRoot);
  return matches;
}

/** Like {@link getAllByComponentType}, but expects exactly one match. */
export function getByComponentType(type: ComponentType<any>, scope?: TestInstance): ComponentMatch {
  const matches = getAllByComponentType(type, scope);
  if (matches.length !== 1) {
    throw new Error(`Expected 1 ${type.displayName ?? type.name} element, found ${matches.length}`);
  }
  return matches[0];
}
