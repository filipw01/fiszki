import { createUserSession, isLoggedIn, register } from '~/session.server'
import { AuthFormContent } from '~/components/AuthFormContent'
import { isNonEmptyString } from '~/utils.server'
import { A, FormError, useParams, useRouteData } from 'solid-start'
import {
  createServerAction$,
  createServerData$,
  redirect,
} from 'solid-start/server'

export const routeData = () =>
  createServerData$(async (_, { request }) => {
    if (await isLoggedIn(request)) {
      const redirectTo = new URL(request.url).searchParams.get('redirectTo')
      throw redirect(redirectTo ?? '/')
    }
    return {}
  })

export default function Signup() {
  const data = useRouteData<typeof routeData>()
  data() // force routeData to run
  const [loggingIn, { Form }] = createServerAction$(async (form: FormData) => {
    const email = form.get('email')
    const password = form.get('password')

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw new FormError('Missing email or password')
    }

    await register({ email, password })

    const redirectTo = form.get('redirectTo')

    return createUserSession(
      email,
      typeof redirectTo === 'string' ? redirectTo : '/'
    )
  })
  const params = useParams()
  return (
    <Form class="h-full">
      <input type="hidden" name="redirectTo" value={params.redirectTo ?? '/'} />
      {loggingIn.error && (
        <p role="alert" id="error-message">
          {loggingIn.error.message}
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
        <A href="/login">I already have an account</A>
      </AuthFormContent>
    </Form>
  )
}
