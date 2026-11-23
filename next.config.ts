import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/home",
        permanent: false,
      },
      // Old prep-service URLs: the list lives in the account area, and the
      // corrected-files form is now on the request's details page.
      {
        source: "/3pl-prep-service/my-prep-requests",
        destination: "/user/pl-services",
        permanent: false,
      },
      {
        source: "/user/pl-services/:id/correction",
        destination: "/user/pl-services/:id",
        permanent: false,
      },
    ];
  },

  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nazmulhasan.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        condition: {
          path: /(^|\/)src\/app\/globals\.css$/,
        },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
