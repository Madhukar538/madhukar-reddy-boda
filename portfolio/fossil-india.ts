export const portfolio = [
  {
    title: "Fossil India Storefront Migration (Angular to Next.js Modernization)",
    doneUsing: "AI agents",
    overview: "Fossil India is a premium e-commerce platform that underwent a significant architectural transformation, migrating from a legacy Angular application to a modern, high-performance Next.js storefront. This project focused on improving core web vitals, enhancing security, and establishing a scalable foundation for future growth while maintaining full feature parity.",
    techStack: [
      "Next.js 15+ (App Router)",
      "React 19",
      "TypeScript (Strict Mode)",
      "Vanilla CSS",
      "CSS Modules",
      "Bootstrap (legacy support)",
      "React Context API",
      "react-slick",
      "yet-another-react-lightbox",
      "crypto-js",
      "RESTful API integration with custom fetch wrappers"
    ],
    features: [
      {
        name: "Dynamic CMS Integration",
        details: [
          "DynamicTemplate component safely injects CMS-driven content using React's dangerouslySetInnerHTML.",
          "Strict, nonce-based Content Security Policy (CSP) for script validation."
        ]
      },
      {
        name: "Advanced Product Detail Page (PDP)",
        details: [
          "Complex product variants (colors, sizes, smart-watch features) with real-time availability checks.",
          "Responsive image slider with lightbox functionality.",
          "Real-time pincode validation and estimated delivery date (EDD) calculations."
        ]
      },
      {
        name: "Optimized Catalog Experience (PLP)",
        details: [
          "High-performance category pages with multi-select filters, sorting, and session-aware search results.",
          "Custom skeleton states to reduce perceived load time and eliminate layout shifts (CLS)."
        ]
      }
    ],
    performance: [
      "Lazy Hydration: IntersectionObserver hydrates heavy components only when in viewport.",
      "Dynamic Imports: next/dynamic splits bundles and loads heavy libraries on-demand.",
      "LCP Prioritization: fetchPriority=\"high\" for hero banners and logos.",
      "Font Optimization: font-display: swap and local font hosting.",
      "Asset Cleanup: Removed 200+ lines of unused legacy CSS."
    ],
    security: [
      "Nonce-based CSP: Individual nonces injected via custom proxy logic.",
      "Secure Headers: HSTS, COOP, Clickjacking protection.",
      "OTP-based Authentication: Robust OTP verification system."
    ],
    challenges: [
      {
        challenge: "Replicating complex Angular lifecycle logic",
        solution: "Mapped ngOnInit and ngAfterContentInit patterns to React Server Components and useEffect hooks."
      },
      {
        challenge: "Managing legacy global CSS conflicts",
        solution: "Migrated shared styles to CSS Modules for local scoping."
      },
      {
        challenge: "Maintaining SEO ranking",
        solution: "Mapped all legacy metadata, canonical tags, and JSON-LD schemas to Next.js's Metadata API."
      }
    ],
    impact: [
      "Modernized DevEx: Type-safe, component-based architecture with TypeScript.",
      "Superior Performance: Drastic reduction in LCP and TBT.",
      "Scalable Infrastructure: Modular codebase ready for future feature integrations."
    ]
  }
];
