import { Firestore } from '@google-cloud/firestore';
import { WowVersion } from '@wowarenalogs/parser';
import fs from 'fs';
import moment from 'moment';
import path from 'path';

import { ApolloContext, CombatQueryResult, ICombatDataStub } from '../types';
import { Constants } from '../utils/constants';
const matchStubsCollection = 'match-stubs-prod';

const firestore = new Firestore({
  projectId: process.env.NODE_ENV === 'development' ? 'wowarenalogs-public-dev' : 'wowarenalogs',
  credentials:
    process.env.NODE_ENV === 'development'
      ? JSON.parse(fs.readFileSync(path.join(process.cwd(), '../cloud/wowarenalogs-public-dev.json'), 'utf8'))
      : undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firestoreDocToMatchStub(stub: ICombatDataStub): ICombatDataStub {
  return stub;
}

export async function latestMatches(
  _parent: unknown,
  args: {
    wowVersion: WowVersion;
    bracket?: string;
    minRating?: number;
    compQueryString?: string;
    lhsShouldBeWinner?: boolean;
    offset: number;
    count: number;
  },
): Promise<CombatQueryResult> {
  const collectionReference = firestore.collection(matchStubsCollection);

  const now = moment().valueOf();
  let docsQuery = collectionReference
    .where('wowVersion', '==', args.wowVersion)
    .orderBy('startTime', 'desc')
    .where('startTime', '<', now);

  if (args.bracket) {
    docsQuery = docsQuery.where('startInfo.bracket', '==', args.bracket);
  }

  if (args.minRating) {
    if (args.minRating >= 2400) {
      docsQuery = docsQuery.where('extra.gte2400', '==', true);
    } else if (args.minRating >= 2100) {
      docsQuery = docsQuery.where('extra.gte2100', '==', true);
    } else if (args.minRating >= 1800) {
      docsQuery = docsQuery.where('extra.gte1800', '==', true);
    } else if (args.minRating >= 1400) {
      docsQuery = docsQuery.where('extra.gte1400', '==', true);
    }
    // FULL PARAM LIST REFERENCE
    // if (args.minRating >= 2700) {
    //   docsQuery = docsQuery.where('extra.gte2700', '==', true);
    // } else if (args.minRating >= 2400) {
    //   docsQuery = docsQuery.where('extra.gte2400', '==', true);
    // } else if (args.minRating >= 2100) {
    //   docsQuery = docsQuery.where('extra.gte2100', '==', true);
    // } else if (args.minRating >= 1800) {
    //   docsQuery = docsQuery.where('extra.gte1800', '==', true);
    // } else if (args.minRating >= 1600) {
    //   docsQuery = docsQuery.where('extra.gte1600', '==', true);
    // } else if (args.minRating >= 1400) {
    //   docsQuery = docsQuery.where('extra.gte1400', '==', true);
    // }
  }

  if (args.compQueryString) {
    if (args.compQueryString.search('x') > 0) {
      if (args.lhsShouldBeWinner) {
        docsQuery = docsQuery.where('extra.doubleSidedSpecsWLHS', 'array-contains', args.compQueryString);
      } else {
        docsQuery = docsQuery.where('extra.doubleSidedSpecs', 'array-contains', args.compQueryString);
      }
    } else {
      if (args.lhsShouldBeWinner) {
        docsQuery = docsQuery.where('extra.singleSidedSpecsWinners', 'array-contains', args.compQueryString);
      } else {
        docsQuery = docsQuery.where('extra.singleSidedSpecs', 'array-contains', args.compQueryString);
      }
    }
  }

  const matchDocs = await docsQuery
    .offset(args.offset)
    .limit(Math.min(args.count, Constants.MAX_RESULTS_PER_QUERY))
    .get();
  const matches = matchDocs.docs.map((d) => firestoreDocToMatchStub(d.data() as ICombatDataStub));

  return {
    combats: matches,
    queryLimitReached: false,
  };
}

export async function matchesWithCombatant(_parent: unknown, args: { playerName: string }) {
  const collectionReference = firestore.collection(matchStubsCollection);
  const matchDocs = await collectionReference
    .where('ownerId', '==', args.playerName)
    .orderBy('startTime', 'desc')
    .limit(Constants.MAX_RESULTS_PER_QUERY)
    .get();
  const matches = matchDocs.docs.map((d) => firestoreDocToMatchStub(d.data() as ICombatDataStub));
  return matches;
}

export async function myMatches(
  _parent: unknown,
  args: { anonymousUserId: string | null; offset: number; count: number },
  context: ApolloContext,
): Promise<CombatQueryResult> {
  if (!context.user && !args.anonymousUserId) {
    return {
      combats: [],
      queryLimitReached: false,
    };
  }

  // if the client says it's anonymous, we verify the user id is indeed within the anonymous namespace.
  // this means any anonymous user can potentially get another anonymous user's matches, but they can't use this as a loophole to get
  // an authenticated user's matches by simply knowing their user id.
  if (args.anonymousUserId && !args.anonymousUserId.startsWith('anonymous:')) {
    return {
      combats: [],
      queryLimitReached: false,
    };
  }

  const userId = context.user ? context.user.battlenetId : args.anonymousUserId;

  const collectionReference = firestore.collection(matchStubsCollection);
  const matchDocs = await collectionReference
    .where('ownerId', '==', `${userId}`)
    .orderBy('startTime', 'desc')
    .offset(args.offset)
    .limit(Math.min(args.count, Constants.MAX_RESULTS_PER_QUERY))
    .get();
  const matches = matchDocs.docs.map((d) => firestoreDocToMatchStub(d.data() as ICombatDataStub));

  return {
    combats: matches,
    queryLimitReached: false,
  };
}

export async function userMatches(
  _parent: unknown,
  args: { userId: string; offset: number; count: number },
): Promise<CombatQueryResult> {
  const collectionReference = firestore.collection(matchStubsCollection);
  const matchDocs = await collectionReference
    .where('ownerId', '==', `${args.userId}`)
    .orderBy('startTime', 'desc')
    .offset(args.offset)
    .limit(Math.min(args.count, Constants.MAX_RESULTS_PER_QUERY))
    .get();
  const matches = matchDocs.docs.map((d) => firestoreDocToMatchStub(d.data() as ICombatDataStub));

  return {
    combats: matches,
    queryLimitReached: false,
  };
}

export async function matchById(_parent: unknown, args: { matchId: string }) {
  const collection = matchStubsCollection;
  const collectionReference = firestore.collection(collection);
  const matchDocs = await collectionReference.where('id', '==', `${args.matchId}`).limit(1).get();
  const match = matchDocs.docs.map((d) => firestoreDocToMatchStub(d.data() as ICombatDataStub))[0];

  return match;
}
