import {
  action,
  createAsync,
  useSubmission,
  useSearchParams,
} from '@solidjs/router'
import { createUserSession, login } from '~/server/session.server'
import { AuthFormContent } from '~/components/AuthFormContent'
import { isNonEmptyString } from '~/utils.server'
import { loggedOutGuard } from '~/server-actions'

const loginAction = action(async (form: FormData) => {
  'use server'

  const email = form.get('email')
  const password = form.get('password')

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return new Error('Missing email or password')
  }

  const result = await login({ email, password })
  if (result === null) {
    return new Error('Invalid email or password')
  }

  const redirectTo = form.get('redirectTo')

  await createUserSession(
    email,
    typeof redirectTo === 'string' ? redirectTo : '/',
  )
}, 'login')

export default function Login() {
  createAsync(() => loggedOutGuard(), { deferStream: true })
  const loggingIn = useSubmission(loginAction)

  const [params] = useSearchParams()
  return (
    <form action={loginAction} method="post" class="h-full">
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
        <AuthFormContent.Submit>Login</AuthFormContent.Submit>
        <a href="/signup">I don't have an account yet</a>
      </AuthFormContent>
    </form>
  )
}
