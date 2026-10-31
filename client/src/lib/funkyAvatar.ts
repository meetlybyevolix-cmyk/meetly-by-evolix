/**
 * Funky Profile Avatar generator for Meetly users.
 * Generates deterministic funky avatars, vibrant gradients, and first-name usernames.
 */

export interface FunkyAvatar {
  id: string;
  emoji: string;
  name: string;
  bgGradient: string;
  border: string;
  shadow: string;
}

export const FUNKY_AVATARS: FunkyAvatar[] = [
  {
    id: "fox",
    emoji: "🦊",
    name: "Clever Fox",
    bgGradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
    border: "#FF6B6B",
    shadow: "rgba(255, 107, 107, 0.35)",
  },
  {
    id: "rocket",
    emoji: "🚀",
    name: "Cosmic Rocket",
    bgGradient: "linear-gradient(135deg, #4E54C8 0%, #8F94FB 100%)",
    border: "#4E54C8",
    shadow: "rgba(78, 84, 200, 0.35)",
  },
  {
    id: "panda",
    emoji: "🐼",
    name: "Zen Panda",
    bgGradient: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
    border: "#11998E",
    shadow: "rgba(17, 153, 142, 0.35)",
  },
  {
    id: "spark",
    emoji: "⚡",
    name: "Super Volt",
    bgGradient: "linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)",
    border: "#F2994A",
    shadow: "rgba(242, 153, 74, 0.35)",
  },
  {
    id: "unicorn",
    emoji: "🦄",
    name: "Dreamy Unicorn",
    bgGradient: "linear-gradient(135deg, #EE9CA7 0%, #FFDDE1 100%)",
    border: "#EE9CA7",
    shadow: "rgba(238, 156, 167, 0.35)",
  },
  {
    id: "pixel",
    emoji: "👾",
    name: "Retro Pixel",
    bgGradient: "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)",
    border: "#E94057",
    shadow: "rgba(233, 64, 87, 0.35)",
  },
  {
    id: "lion",
    emoji: "🦁",
    name: "Brave Lion",
    bgGradient: "linear-gradient(135deg, #F37335 0%, #FDC830 100%)",
    border: "#F37335",
    shadow: "rgba(243, 115, 53, 0.35)",
  },
  {
    id: "avo",
    emoji: "🥑",
    name: "Fresh Avo",
    bgGradient: "linear-gradient(135deg, #56AB2F 0%, #A8E063 100%)",
    border: "#56AB2F",
    shadow: "rgba(86, 171, 47, 0.35)",
  },
  {
    id: "artist",
    emoji: "🎨",
    name: "Creative Spirit",
    bgGradient: "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
    border: "#FC466B",
    shadow: "rgba(252, 70, 107, 0.35)",
  },
  {
    id: "tiger",
    emoji: "🐯",
    name: "Wild Tiger",
    bgGradient: "linear-gradient(135deg, #FF8008 0%, #FFC837 100%)",
    border: "#FF8008",
    shadow: "rgba(255, 128, 8, 0.35)",
  },
  {
    id: "dj",
    emoji: "🎧",
    name: "Funky Beats",
    bgGradient: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
    border: "#00C9FF",
    shadow: "rgba(0, 201, 255, 0.35)",
  },
  {
    id: "hero",
    emoji: "🦹",
    name: "Night Hero",
    bgGradient: "linear-gradient(135deg, #654EA3 0%, #EAAFC8 100%)",
    border: "#654EA3",
    shadow: "rgba(101, 78, 163, 0.35)",
  },
];

/**
 * Extracts first name to use as username.
 * e.g., "Saifuddin Wadlawala" -> "Saifuddin"
 */
export function getFirstName(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") return "Stranger";
  const trimmed = fullName.trim();
  if (!trimmed) return "Stranger";
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * Deterministically generates a funky avatar for a user based on their ID or name.
 */
export function getFunkyAvatar(identifier?: string | null): FunkyAvatar {
  const key = identifier && identifier.trim() ? identifier.trim() : "default";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FUNKY_AVATARS.length;
  return FUNKY_AVATARS[index];
}

