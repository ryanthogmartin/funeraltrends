export interface KeywordCategory {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
}

export const KEYWORD_CATEGORIES: KeywordCategory[] = [
  {
    id: "funeral-general",
    label: "Funeral (General)",
    emoji: "🖤",
    keywords: [
      "funeral", "funeral services", "funeral directors", "funeral arrangements", "funeral planning",
      "funeral etiquette", "what to wear to a funeral", "funeral flowers", "funeral flower arrangements",
      "funeral music", "what to say at a funeral", "funeral parlor", "funeral home", "funeral procession",
      "funeral reception ideas",
    ],
  },
  {
    id: "cremation",
    label: "Cremation",
    emoji: "🔥",
    keywords: [
      "cremation", "cremation services", "direct cremation", "direct cremation cost",
      "how much does cremation cost", "cremation vs burial", "what is direct cremation",
      "full service cremation", "cremation urns", "what to do with ashes after cremation",
      "how long does cremation take", "aquamation water cremation", "affordable cremation services",
      "cremation cost by state", "scattering ashes laws",
    ],
  },
  {
    id: "death-burial",
    label: "Death & Burial",
    emoji: "🪦",
    keywords: [
      "caskets", "coffins", "burial services", "burial plots", "embalming", "hearse",
      "graveside service", "direct burial", "immediate burial", "burial vault", "mausoleum",
      "what is a burial vault", "open casket funeral", "military burial", "headstones and grave markers",
    ],
  },
  {
    id: "death-certificates",
    label: "Death Certificates",
    emoji: "📋",
    keywords: [
      "how to get a death certificate", "death certificate copy", "death certificate request",
      "certified copy of death certificate", "how long does a death certificate take",
      "how many death certificates do I need", "death certificate cost", "death certificate apostille",
      "how to obtain a death certificate for a parent", "death certificate name change",
      "death certificate vs death notice", "online death certificate request",
      "vital records death certificate", "replace lost death certificate",
      "death certificate after cremation",
    ],
  },
  {
    id: "eco-friendly",
    label: "Eco-Friendly / Green Burial",
    emoji: "🌿",
    keywords: [
      "green burial", "natural burial", "eco friendly burial", "biodegradable casket",
      "conservation burial", "water cremation aquamation", "human composting burial",
      "natural burial vs cremation", "shroud burial", "green burial cost", "biodegradable urn",
      "forest burial", "alkaline hydrolysis", "what is a green burial", "green burial cemetery",
    ],
  },
  {
    id: "funeral-pricing",
    label: "Funeral Pricing",
    emoji: "💰",
    keywords: [
      "how much does a funeral cost", "average funeral cost", "funeral cost breakdown",
      "cheap funeral options", "affordable funeral services", "funeral pre-planning costs",
      "funeral price list", "direct cremation cost vs burial", "funeral home price comparison",
      "low cost funeral options", "funeral expenses who pays", "prepaid funeral plans",
      "funeral insurance", "burial insurance", "final expense insurance",
    ],
  },
  {
    id: "preplanning",
    label: "PrePlanning",
    emoji: "📅",
    keywords: [
      "funeral pre-planning", "prepaid funeral plans", "how to pre-plan a funeral",
      "funeral prearrangement", "pre-need funeral planning", "funeral pre-planning costs",
      "benefits of pre-planning a funeral", "funeral planning checklist",
      "pre-planned funeral vs prepaid funeral", "how to plan a funeral in advance",
      "funeral wishes document", "end of life planning", "advance funeral directive",
      "what happens if you don't pre-plan a funeral", "funeral pre-planning for aging parents",
    ],
  },
  {
    id: "funeral-products",
    label: "Funeral Products",
    emoji: "🛍️",
    keywords: [
      "funeral urns", "casket prices", "keepsake urns", "memorial jewelry from ashes",
      "biodegradable urns", "funeral program templates", "memorial candles", "cremation jewelry",
      "funeral wreaths", "memorial plaques", "sympathy gift baskets", "memorial wind chimes",
      "personalized urns", "funeral casket sprays", "memorial stones and garden markers",
    ],
  },
  {
    id: "cemetery",
    label: "Cemetery",
    emoji: "🪧",
    keywords: [
      "cemetery", "burial plots cost", "cemetery plot prices", "national cemetery",
      "veterans cemetery", "cemetery records", "how to find a grave", "cemetery memorial gardens",
      "pet cemetery", "conservation cemetery", "mausoleum cost", "cemetery maintenance fees",
      "cemetery plot transfer", "columbarium", "find a grave online",
    ],
  },
  {
    id: "pet-services",
    label: "Pet Services",
    emoji: "🐾",
    keywords: [
      "pet cremation", "pet cremation cost", "pet funeral services", "how to handle pet loss",
      "pet burial options", "dog cremation", "cat cremation", "pet memorial ideas", "pet cemetery",
      "pet urns", "pet loss grief support", "in-home pet euthanasia", "pet memorial jewelry",
      "biodegradable pet urns", "paw print memorial keepsakes",
    ],
  },
  {
    id: "grief-healing",
    label: "Grief & Healing",
    emoji: "💙",
    keywords: [
      "grief support", "grief counseling", "stages of grief", "how to cope with loss",
      "bereavement support", "grief support groups", "coping with the death of a parent",
      "coping with the death of a spouse", "grief after loss of a child", "how long does grief last",
      "grief therapist", "complicated grief", "anticipatory grief", "online grief support",
      "grief books and resources",
    ],
  },
  {
    id: "veteran-services",
    label: "Veteran Services",
    emoji: "🎖️",
    keywords: [
      "veteran burial benefits", "VA burial allowance", "free burial for veterans",
      "veterans national cemetery", "military funeral honors", "how to apply for VA burial benefits",
      "veteran cremation benefits", "military funeral flag ceremony", "presidential memorial certificate",
      "veteran headstone application", "military funeral honors eligibility",
      "VA burial benefit reimbursement", "veteran survivor benefits", "TRICARE funeral benefits",
      "veteran pre-need burial eligibility",
    ],
  },
  {
    id: "aftercare-services",
    label: "Aftercare Services",
    emoji: "🤝",
    keywords: [
      "funeral aftercare services", "bereavement follow up", "grief support after funeral",
      "estate settlement assistance", "what to do after a funeral", "post funeral checklist",
      "survivor benefits after death", "notifying agencies after death", "closing accounts after death",
      "how to cancel subscriptions after death", "transferring assets after death",
      "probate process after death", "memorial anniversary support", "bereavement leave resources",
      "digital estate planning after death",
    ],
  },
  {
    id: "funeral-home-marketing",
    label: "Funeral Home Marketing",
    emoji: "📣",
    keywords: [
      "funeral home website design", "funeral home SEO", "funeral home social media marketing",
      "funeral home Google ads", "funeral home reputation management", "funeral home email marketing",
      "funeral home branding", "funeral home online reviews", "funeral home digital marketing",
      "funeral home content marketing", "funeral home Google Business Profile",
      "funeral home video marketing", "funeral home community outreach",
      "funeral home PPC advertising", "funeral home obituary marketing",
    ],
  },
  {
    id: "celebration-of-life",
    label: "Celebration of Life",
    emoji: "🎉",
    keywords: [
      "celebration of life", "celebration of life ideas", "celebration of life vs funeral",
      "how to plan a celebration of life", "celebration of life themes", "celebration of life venues",
      "outdoor celebration of life ideas", "celebration of life decorations",
      "celebration of life invitations", "celebration of life food ideas",
      "celebration of life music playlist", "virtual celebration of life",
      "celebration of life speech ideas", "celebration of life activities for guests",
      "unique celebration of life ideas",
    ],
  },
];

export const ALL_KEYWORDS = KEYWORD_CATEGORIES.flatMap(c => c.keywords);

export function getCategoryForKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();
  for (const cat of KEYWORD_CATEGORIES) {
    if (cat.keywords.some(k => k.toLowerCase() === lower)) {
      return cat.id;
    }
  }
  return "custom";
}

export function getCategoryLabel(categoryId: string): string {
  const cat = KEYWORD_CATEGORIES.find(c => c.id === categoryId);
  return cat ? `${cat.emoji} ${cat.label}` : "Custom";
}
