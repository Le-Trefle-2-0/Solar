import { signIn } from "@/auth"
 
export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("discord", { redirectTo: "/dashboard" })
      }}
    >
      <button type="submit">Sign in with Discord</button>
    </form>
  )
}