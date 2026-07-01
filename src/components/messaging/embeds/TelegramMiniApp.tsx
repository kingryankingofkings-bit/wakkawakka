"use client";

import React, { useState } from "react";

/**
 * Telegram-style mini web app embedded in a message bubble.
 * Includes an inline calculator demo.
 */
export function TelegramMiniApp({ appData }: { appData: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [calcVal, setCalcVal] = useState("0");

  const handleCalcClick = (char: string) => {
    if (char === "C") setCalcVal("0");
    else if (char === "=") {
      try {
        // eslint-disable-next-line no-eval
        setCalcVal(String(eval(calcVal)));
      } catch {
        setCalcVal("Error");
      }
    } else {
      setCalcVal((prev) => (prev === "0" ? char : prev + char));
    }
  };

  return (
    <div className="bg-card text-foreground border border-border rounded-2xl p-3 my-1.5 max-w-[260px] space-y-2 text-xs shadow-sm">
      <div className="font-bold text-sky-500 flex items-center gap-1.5">
        <span>🤖</span> {appData || "Inline Utility app"}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Launch tool instantly inside a modal webview container.
      </p>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors"
      >
        Open Mini WebApp
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl w-72 p-4 space-y-4 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="font-bold text-sm text-sky-500">
                Calculator WebApp
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-muted p-3 rounded-2xl text-right font-mono text-xl truncate text-foreground">
              {calcVal}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                "7", "8", "9", "/",
                "4", "5", "6", "*",
                "1", "2", "3", "-",
                "C", "0", "=", "+",
              ].map((char) => (
                <button
                  key={char}
                  onClick={() => handleCalcClick(char)}
                  className="p-2.5 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-colors"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
