"use client";

import { Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import type { Faq } from "@/services/faq.service";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut" as const,
    },
  },
};

/**
 * Two columns, filled top to bottom: the left column takes the first half.
 * Reading order, Tab order and the one-column mobile layout all follow the
 * admin's order this way.
 */
function splitIntoColumns(faqs: Faq[]) {
  const half = Math.ceil(faqs.length / 2);
  return [faqs.slice(0, half), faqs.slice(half)].filter(
    (column) => column.length > 0,
  );
}

export default function FAQContainer({ faqs }: { faqs: Faq[] }) {
  // Everything starts collapsed; opening one item closes the others.
  const [openId, setOpenId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const idPrefix = useId();

  return (
    <div className="mt-10 grid grid-cols-1 items-start gap-4 sm:mt-12 md:grid-cols-2 md:gap-5">
      {splitIntoColumns(faqs).map((column, columnIndex) => (
        <motion.div
          className="flex flex-col gap-4 md:gap-5"
          key={columnIndex}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {column.map((faq) => {
            const isOpen = openId === faq.id;
            const buttonId = `${idPrefix}-faq-${faq.id}-question`;
            const panelId = `${idPrefix}-faq-${faq.id}-answer`;

            return (
              <motion.article
                variants={itemVariants}
                layout={!reduceMotion}
                className={`overflow-hidden rounded-2xl border border-[#F0F0F0] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors duration-300 sm:px-5 sm:py-5 ${
                  isOpen
                    ? "border-primary-color bg-primary-color/90"
                    : "border-slate-100 bg-white"
                }`}
                key={faq.id}
              >
                <h2>
                  <button
                    id={buttonId}
                    aria-controls={panelId}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-start justify-between gap-4 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-color"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    type="button"
                  >
                    <span
                      className={`pt-0.5 text-sm font-bold sm:text-xl ${
                        isOpen ? "text-secondary-color" : "text-[#170F49]"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary-color/10 text-secondary-color">
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className="flex"
                      >
                        {isOpen ? (
                          <Minus aria-hidden="true" className="size-4" />
                        ) : (
                          <Plus aria-hidden="true" className="size-4" />
                        )}
                      </motion.span>
                    </span>
                  </button>
                </h2>

                {/* The panel stays mounted so aria-controls always points at
                    it; `inert` hides a closed answer from focus and screen
                    readers. */}
                <motion.div
                  id={panelId}
                  inert={!isOpen}
                  initial={false}
                  animate={
                    isOpen
                      ? { height: "auto", opacity: 1 }
                      : { height: 0, opacity: 0 }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          height: { duration: 0.3, ease: "easeInOut" },
                          opacity: { duration: 0.2 },
                        }
                  }
                  className="overflow-hidden"
                >
                  {/* Plain text: React escapes it, and pre-line keeps the
                      admin's line breaks. */}
                  <p className="whitespace-pre-line pt-3 leading-5 text-[#44403C] sm:leading-6">
                    {faq.answer}
                  </p>
                </motion.div>
              </motion.article>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
