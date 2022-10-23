import { Firestore } from '@google-cloud/firestore';
import { FirestoreNextAuthAdapter } from '@wowarenalogs/shared';
import NextAuth from 'next-auth';

const firestore = new Firestore({
  ignoreUndefinedProperties: true,
});

export default NextAuth({
  providers: [
    {
      id: 'battlenet',
      name: 'Battle.net',
      type: 'oauth',
      wellKnown: 'https://oauth.battle.net/.well-known/openid-configuration',
      async profile(profile, _tokens) {
        return {
          id: profile.sub,
          battletag: profile.battle_tag,
          name: profile.battle_tag,
        };
      },
      clientId: process.env.BLIZZARD_CLIENT_ID,
      clientSecret: process.env.BLIZZARD_CLIENT_SECRET,
    },
  ],
  adapter: FirestoreNextAuthAdapter(firestore),
  jwt: {
    maxAge: 90 * 24 * 60 * 60, // 90 days
  },
  callbacks: {
    jwt: async (params) => {
      return Promise.resolve(params.profile ? params.profile : params.token);
    },
    session: async (params) => {
      params.session.user = params.user;
      return Promise.resolve(params.session);
    },
  },
});