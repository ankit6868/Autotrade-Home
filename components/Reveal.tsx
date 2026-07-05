"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type As = "div" | "section" | "li" | "span" | "ul";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: As;
};

const map = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  span: motion.span,
  ul: motion.ul,
} as const;

/**
 * Scroll-triggered reveal. Short, purposeful motion (content-map rule 2):
 * ~0.5s, fires once when 20% in view, and collapses to a no-op under
 * prefers-reduced-motion. `as` renders the correct semantic element so we
 * never wrap a <li> in a <div>.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  as = "div",
}: Props) {
  const reduce = useReducedMotion();
  const Comp = map[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Comp>
  );
}
