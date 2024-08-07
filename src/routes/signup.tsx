import { createUserSession, register } from '~/server/session.server'
import { AuthFormContent } from '~/components/AuthFormContent'
import { isNonEmptyString } from '~/utils.server'
import {
  action,
  useSubmission,
  createAsync,
  useSearchParams,
} from '@solidjs/router'
import { loggedOutGuard } from '~/server-actions'

const registerAction = action(async (form: FormData) => {
  'use server'

  const email = form.get('email')
  const password = form.get('password')

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return new Error('Missing email or password')
  }

  await register({ email, password })

  const redirectTo = form.get('redirectTo')

  await createUserSession(
    email,
    typeof redirectTo === 'string' ? redirectTo : '/',
  )
}, 'register')

export default function Signup() {
  createAsync(() => loggedOutGuard())
  const loggingIn = useSubmission(registerAction)
  const [params] = useSearchParams()
  return (
    <form method="post" action={registerAction} class="h-full">
      <input type="hidden" name="redirectTo" value={params.redirectTo ?? '/'} />
      {loggingIn.result && (
        <p role="alert" id="error-message">
          {loggingIn.result.message}
        </p>
      )}
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
