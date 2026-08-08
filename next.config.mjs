/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp is a native module — keep it out of the webpack server bundle so it
  // loads from node_modules with its platform binary at runtime on Vercel.
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
};

export default nextConfig;
