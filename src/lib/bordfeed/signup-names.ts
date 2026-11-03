// Mirrors Bordfeed's agent sign-up name rules (lib/agents/signup/agent-name.ts
// in the Bordfeed repo) so Bordful never sends a name live would reject.

const AGENT_NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._()-]{0,63}$/u;
const DOMAIN_TOKEN = /\p{L}\.\p{L}/u;
const WWW_WORD = /\bwww\b/u;
const GAP = /[\s()[\]{}]/u;
const BRACKET = /[()[\]{}]/u;
const LETTER = /\p{L}/u;
export const BOARD_NAME_MAX = 80;

function hasControlChar(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}

// "evil .com" or "evil [.] com". "Dr. Smith" stays: the dot is glued to the
// letter before it and only spaces follow.
function hasSeparatedDomainDot(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== ".") {
      continue;
    }

    let left = index - 1;
    while (left >= 0 && GAP.test(value.charAt(left))) {
      left -= 1;
    }
    let right = index + 1;
    while (right < value.length && GAP.test(value.charAt(right))) {
      right += 1;
    }
    if (left < 0 || right >= value.length) {
      continue;
    }
    if (
      !(LETTER.test(value.charAt(left)) && LETTER.test(value.charAt(right)))
    ) {
      continue;
    }

    const afterDot = value.slice(index + 1, right);
    const gluedAbbreviation =
      left === index - 1 && afterDot.trim() === "" && !BRACKET.test(afterDot);
    if (!gluedAbbreviation) {
      return true;
    }
  }

  return false;
}

export function looksLikeUrlOrDomain(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("://") ||
    WWW_WORD.test(lower) ||
    DOMAIN_TOKEN.test(value) ||
    hasSeparatedDomainDot(value)
  );
}

export function isValidAgentName(raw: string): boolean {
  const name = raw.trim();
  return AGENT_NAME.test(name) && !looksLikeUrlOrDomain(name);
}

// Live accepts 1 to 80 characters with no URL, domain or control character.
export function isValidBoardName(raw: string): boolean {
  const name = raw.trim();
  return (
    name.length > 0 &&
    name.length <= BOARD_NAME_MAX &&
    !hasControlChar(name) &&
    !looksLikeUrlOrDomain(name)
  );
}
