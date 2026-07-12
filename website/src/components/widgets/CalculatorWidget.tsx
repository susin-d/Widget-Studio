import { useState } from "react";
import { ArrowLeftRight, Percent } from "lucide-react";

export function CalculatorWidget() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isCalculated, setIsCalculated] = useState(false);

  // Conversion mode state
  const [isConverter, setIsConverter] = useState(false);
  const [convType, setConvType] = useState<"temp" | "length" | "weight">("temp");
  const [convValue, setConvValue] = useState("");
  const [convResult, setConvResult] = useState("");

  const handleNum = (num: string) => {
    if (display === "0" || isCalculated) {
      setDisplay(num);
      setIsCalculated(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ");
    setDisplay("0");
    setIsCalculated(false);
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setIsCalculated(false);
  };

  const handleEqual = () => {
    if (!equation) return;
    const parts = equation.split(" ");
    const num1 = parseFloat(parts[0]);
    const op = parts[1];
    const num2 = parseFloat(display);

    let result = 0;
    if (op === "+") result = num1 + num2;
    else if (op === "-") result = num1 - num2;
    else if (op === "*") result = num1 * num2;
    else if (op === "/") result = num2 !== 0 ? num1 / num2 : 0;

    setDisplay(String(Number(result.toFixed(8))));
    setEquation("");
    setIsCalculated(true);
  };

  const handleConvert = (val: string) => {
    setConvValue(val);
    const num = parseFloat(val);
    if (isNaN(num)) {
      setConvResult("");
      return;
    }

    if (convType === "temp") {
      // Celsius to Fahrenheit
      setConvResult(`${((num * 9) / 5 + 32).toFixed(2)} °F`);
    } else if (convType === "length") {
      // Cm to Inch
      setConvResult(`${(num / 2.54).toFixed(2)} in`);
    } else if (convType === "weight") {
      // Kg to Lbs
      setConvResult(`${(num * 2.20462).toFixed(2)} lbs`);
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-2 select-none justify-between">
      {/* Tab Selector */}
      <div className="flex gap-1.5 rounded-lg bg-black/5 dark:bg-white/5 p-1 mb-2">
        <button
          onClick={() => setIsConverter(false)}
          className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition ${
            !isConverter
              ? "bg-white text-black shadow dark:bg-white/10 dark:text-white"
              : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          Calculator
        </button>
        <button
          onClick={() => {
            setIsConverter(true);
            handleConvert(convValue);
          }}
          className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition flex items-center justify-center gap-1 ${
            isConverter
              ? "bg-white text-black shadow dark:bg-white/10 dark:text-white"
              : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <ArrowLeftRight size={10} />
          <span>Converter</span>
        </button>
      </div>

      {isConverter ? (
        <div className="flex-1 flex flex-col justify-between py-1 px-1">
          {/* Converter Fields */}
          <div className="space-y-2">
            <div className="flex gap-1">
              {(["temp", "length", "weight"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setConvType(type);
                    setConvValue("");
                    setConvResult("");
                  }}
                  className={`flex-1 text-[9px] py-1 rounded border capitalize ${
                    convType === type
                      ? "border-accent bg-accent/5 text-accent font-bold"
                      : "border-black/10 dark:border-white/10 text-muted"
                  }`}
                >
                  {type === "temp" ? "Temp (C→F)" : type === "length" ? "Len (cm→in)" : "Wgt (kg→lb)"}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="number"
                placeholder="Enter value..."
                value={convValue}
                onChange={(e) => handleConvert(e.target.value)}
                className="w-full text-xs bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10 p-1.5 outline-none text-right font-mono"
              />
              <div className="w-full text-xs bg-accent/5 dark:bg-accent/10 rounded border border-accent/25 p-1.5 text-right font-mono font-bold text-accent min-h-[30px] flex items-center justify-end">
                {convResult || "—"}
              </div>
            </div>
          </div>
          <div className="text-[9px] text-muted text-center">Fast real-time unit converter</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          {/* Calculator Screen */}
          <div className="text-right px-1 pb-1">
            <div className="text-[10px] text-muted font-mono h-4 truncate">{equation}</div>
            <div className="text-lg font-bold font-mono truncate leading-none pt-0.5">{display}</div>
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={handleClear}
              className="py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition"
            >
              C
            </button>
            <button
              onClick={() => handleOperator("/")}
              className="py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition"
            >
              /
            </button>
            <button
              onClick={() => handleOperator("*")}
              className="py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition"
            >
              *
            </button>
            <button
              onClick={() => handleOperator("-")}
              className="py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition"
            >
              -
            </button>

            {["7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handleNum(num)}
                className="py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium transition"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleOperator("+")}
              className="row-span-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold flex items-center justify-center transition"
            >
              +
            </button>

            {["4", "5", "6"].map((num) => (
              <button
                key={num}
                onClick={() => handleNum(num)}
                className="py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium transition"
              >
                {num}
              </button>
            ))}

            {["1", "2", "3"].map((num) => (
              <button
                key={num}
                onClick={() => handleNum(num)}
                className="py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium transition"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleEqual}
              className="row-span-2 py-1.5 rounded-lg bg-accent text-white hover:opacity-90 text-xs font-bold flex items-center justify-center transition shadow shadow-accent/20"
            >
              =
            </button>

            <button
              onClick={() => handleNum("0")}
              className="col-span-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium transition"
            >
              0
            </button>
            <button
              onClick={() => handleNum(".")}
              className="py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium transition"
            >
              .
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
