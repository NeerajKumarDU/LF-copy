/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }, // leftover placeholder-post photography
      // Featured images in prod go through the nginx alias, not Next's boot-time public/
      // listing, so post-restart uploads still optimize — see lib/posts.ts WP_UPLOADS_BASE.
      // Keep images.loader at its default: any custom loader makes /_next/image return 404.
      { protocol: "https", hostname: "lawsforum.com", pathname: "/wp-content/uploads/**" },
    ],
    // placeholder-cover.svg / placeholder-avatar.svg (lib/posts.ts fallbacks) are SVG,
    // which next/image blocks by default (XSS risk via embedded <script>). Both are
    // static assets we authored ourselves, not user-controlled, so this is safe —
    // paired with the CSP Next's own docs recommend for exactly this case.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
