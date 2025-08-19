import { z } from 'zod'

// Separate server and client validation. In the browser, Next.js replaces
// direct property accesses like process.env.NEXT_PUBLIC_* at build time,
// but process.env as an object is not populated. Parsing process.env in the
// client will always fail, so we construct the object explicitly there.

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  OPENAI_API_KEY: z.string().min(10).optional(),
  OPENAI_MODEL: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
})

const clientSchema = serverSchema.pick({
  NODE_ENV: true,
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_POSTHOG_KEY: true,
  NEXT_PUBLIC_POSTHOG_HOST: true,
})

type ServerEnv = z.infer<typeof serverSchema>
type ClientEnv = z.infer<typeof clientSchema>
type Env = ServerEnv & ClientEnv

const isServer = typeof window === 'undefined'

export const env: Env = isServer
  ? (() => {
      const parsed = serverSchema.safeParse(process.env)
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ')
        throw new Error(`Missing or invalid environment variables: ${issues}`)
      }
      return parsed.data as Env
    })()
  : (() => {
      const parsed = clientSchema.safeParse({
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      })
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ')
        throw new Error(`Missing or invalid environment variables: ${issues}`)
      }
      return parsed.data as Env
    })()


