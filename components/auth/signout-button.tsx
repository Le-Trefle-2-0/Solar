import { signOut } from "@/auth.ts"

export function SignOut() {
    return (
        <form
            action={async () => {
                "use server"
                await signOut()
            }}
        >
            <button type="submit">Sign Out</button>
        </form>
    )
}