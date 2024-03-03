import { createUserSession, register } from '~/server/session.server'
import { AuthFormContent } from '~/components/AuthFormContent'
import { isNonEmptyString } from '~/utils.server'
import {
  useParams,
  RouteDefinition,
  action,
  useSubmission,
} from '@solidjs/router'
import { loggedOutGuard } from '~/server-actions'

// createServerData$(async (_, { request }) => {
//   if (await isLoggedIn(request)) {
//     const redirectTo = new URL(request.url).searchParams.get('redirectTo')
//     throw redirect(redirectTo ?? '/')
//   }
//   return {}
// })
export const route = {
  load: () => loggedOutGuard(),
} satisfies RouteDefinition

const registerAction = action(async (form: FormData) => {
  'use server'

  const email = form.get('email')
  const password = form.get('password')

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new Error('Missing email or password')
  }

  await register({ email, password })

  const redirectTo = form.get('redirectTo')

  return createUserSession(
    email,
    typeof redirectTo === 'string' ? redirectTo : '/'
  )
}, 'register')

export default function Signup() {
  const loggingIn = useSubmission(registerAction)
  const params = useParams()
  return (
    <form method="post" action={registerAction} class="h-full">
      <input type="hidden" name="redirectTo" value={params.redirectTo ?? '/'} />
      {/*{loggingIn.error && (*/}
      {/*  <p role="alert" id="error-message">*/}
      {/*    {loggingIn.error.message}*/}
      {/*  </p>*/}
      {/*)}*/}
      {loggingIn.pending && <p>Logging in...</p>}
      <AuthFormContent>
        <AuthFormContent.Field type="email" name="email" label="Email" />
        <AuthFormContent.Field
          type="password"
          name="password"
          label="Password"
        />
        <AuthFormContent.Submit>Sign Up</AuthFormContent.Submit>
        <a href="/login">I already have an account</a>
      </AuthFormContent>
    </form>
  )
}
