import { redirect } from 'next/navigation'

// This is the root page. It should redirect to the login page
// or dashboard if the user is authenticated.
// For this app, we will always redirect to the login page for simplicity.
export default function RootPage() {
  redirect('/login')
}
