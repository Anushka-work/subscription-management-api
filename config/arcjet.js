import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";
import { ARCJET_KEY, NODE_ENV } from './env.js'

const aj = arcjet({
  key: ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: NODE_ENV === 'development' ? "DRY_RUN" : "LIVE" }),
    detectBot({
      mode: NODE_ENV === 'development' ? "DRY_RUN" : "LIVE",
      allow: [ 
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:API",
        "CATEGORY:MONITORING"
      ],
    }),
    tokenBucket({
      mode: NODE_ENV === 'development' ? "DRY_RUN" : "LIVE",
      refillRate: 5, // Refill 5 tokens per interval
      interval: 10, // Refill every 10 seconds
      capacity: 10, // Bucket capacity of 10 tokens
    }),
  ],
});

export default aj;