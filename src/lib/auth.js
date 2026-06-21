import GoogleProvider from 'next-auth/providers/google';

const API_URL = process.env.SISMA_API_URL;

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Call SISMA backend to authenticate user by email
      try {
        const url = new URL(API_URL);
        url.searchParams.set('path', '/api/v1/auth/login');

        const res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
          redirect: 'follow',
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error('SISMA login response not JSON:', text);
          return false;
        }

        if (data.success && data.data) {
          // Attach SISMA session data to user object for jwt callback
          user.sismaToken = data.data.token;
          user.sismaUser = data.data.user;
          user.expiresAt = data.data.expires_at;
          return true;
        }

        // User not registered in SISMA system
        return '/?error=NotRegistered';
      } catch (error) {
        console.error('SISMA login error:', error);
        return '/?error=ServerError';
      }
    },

    async jwt({ token, user }) {
      // On initial sign-in, transfer SISMA data from user to JWT
      if (user?.sismaToken) {
        token.sismaToken = user.sismaToken;
        token.sismaUser = user.sismaUser;
        token.expiresAt = user.expiresAt;
      }

      // Auto-refresh SISMA token if expired
      if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        try {
          const url = new URL(API_URL);
          url.searchParams.set('path', '/api/v1/auth/login');

          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: token.sismaUser?.email }),
            redirect: 'follow',
          });

          const data = await res.json();
          if (data.success && data.data) {
            token.sismaToken = data.data.token;
            token.sismaUser = data.data.user;
            token.expiresAt = data.data.expires_at;
            token.error = undefined;
          } else {
            token.error = 'TokenExpired';
          }
        } catch {
          token.error = 'RefreshFailed';
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.sismaToken = token.sismaToken;
      session.error = token.error;
      if (token.sismaUser) {
        session.user = {
          ...session.user,
          user_id: token.sismaUser.user_id,
          role: token.sismaUser.role,
          branch_id: token.sismaUser.branch_id,
        };
      }
      session.expiresAt = token.expiresAt;
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
