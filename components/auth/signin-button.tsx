import { signIn } from "@/auth"

export default function SigninButton() {
    return (
        <form
            action={async () => {
                "use server"
                await signIn("discord")
            }}
        >
            <button type="submit">Se connecter avec Discord</button>
        </form>
    )
}