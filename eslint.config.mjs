import next from "eslint-config-next";

const config = [...next, { ignores: [".next/**", "drizzle/**", "spotify-visualiser/**"] }];

export default config;
