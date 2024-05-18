const keywords = {
  class: 0,
  const: 0,
  do: 0,
  else: 0,
  for: 0,
  function: 0,
  if: 0,
  let: 0,
  return: 0,
  static: 0,
  switch: 0,
  var: 0,
  while: 0,
};
const symbols = {
  "{": "lbracket",
  "}": "rbracket",
  "[": "lsqbracket",
  "]": "rsqbracket",
  "(": "lparen",
  ")": "rparen",
  "=": "equals",
  ";": "semicolon",
  ",": "comma",

  "+": "plus",
  "-": "minus",
  "*": "star",
  "/": "slash",
  "%": "percent",

  "--": "decrement",
  "++": "increment",

  "?": "question",
  ":": "colon",
};

export function lex(source) {
  let tokens = [];

  for (let ind = 0; ind < source.length; ind += 1) {
    const char = source[ind];

    //Whitespace
    if (/\s/.test(char)) continue;

    //Two char symbol
    let two = char + source[ind + 1];
    if (symbols[two] != null) {
      tokens.push({ type: symbols[two], value: two });
      ind += 1;
    }
    //One char symbol
    else if (symbols[char] != null) {
      tokens.push({ type: symbols[char], value: char });
    }
    //Number
    else if (/[0-9.]/.test(char)) {
      let num = "";
      let decimal = false;
      let e = false;

      while (ind < source.length) {
        //Digit
        if (/[0-9]/.test(source[ind])) num += source[ind];
        //Decimal point
        else if (source[ind] == ".") {
          if (decimal) throw new Error(`Unexpected character "."`);
          num += source[ind];
        } else if (source[ind] == "e" && !e) num += source[ind];
        //No more characters to consume
        else break;

        ind += 1;
      }

      ind -= 1;

      tokens.push({ type: "number", value: parseFloat(num) });
    }
    //Identifier
    else if (/[a-zA-Z0-9_]/.test(char)) {
      let identifier = "";
      while (ind < source.length && /[a-zA-Z0-9_]/.test(source[ind])) {
        identifier += source[ind];
        ind += 1;
      }

      if (identifier == "true" || identifier == "false") {
        tokens.push({ type: "bool", value: identifier == "true" });
      } else if (keywords[identifier] != null) {
        tokens.push({ type: identifier, value: identifier });
      } else tokens.push({ type: "identifier", value: identifier });

      ind -= 1;
    } else {
      throw new Error(`Unexpected character ${char}`);
    }
  }

  tokens.push({ type: "EOF", value: "end of input" });
  return tokens;
}
