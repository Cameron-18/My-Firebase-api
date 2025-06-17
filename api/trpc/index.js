const { initTRPC } = require('@trpc/server');
const { fetchRequestHandler } = require('@trpc/server/adapters/fetch');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

const t = initTRPC.create();

const appRouter = t.router({
  saveData: t.procedure
    .input(z => z.object({
      key: z.string(),
      value: z.any(),
    }))
    .mutation(async ({ input }) => {
      await db.collection('syncData').doc(input.key).set({ value: input.value });
      return { status: 'success' };
    }),

  getData: t.procedure
    .input(z => z.object({
      key: z.string(),
    }))
    .query(async ({ input }) => {
      const doc = await db.collection('syncData').doc(input.key).get();
      if (!doc.exists) return { data: null };
      return { data: doc.data() };
    }),
});

module.exports = (req, res) => {
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    res,
    router: appRouter,
    createContext: () => ({}),
  });
};
