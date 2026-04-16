"use client";

import {authClient} from "@/lib/auth-client";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Switch} from "@/components/ui/switch";
import {useState} from "react";
import {toast} from "sonner";
import {Loader2} from "lucide-react";

export function NewsletterCard() {
    const session = authClient.useSession();
    const [loading, setLoading] = useState(false);

    const newsletterSubscription = (session.data?.user as any)?.newsletterSubscription as boolean | undefined;

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        try {
            await (authClient.updateUser as any)({
                newsletterSubscription: checked
            });
            toast.success("Préférences de newsletter mises à jour");
        } catch (error) {
            toast.error("Échec de la mise à jour des préférences");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Newsletter</CardTitle>
                <CardDescription>
                    Gérez votre abonnement à notre newsletter.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin"/>
                    ) : (
                        <Switch
                            id="newsletter"
                            checked={newsletterSubscription}
                            onCheckedChange={(checked) => handleToggle(checked)}
                        />
                    )}
                    <label
                        htmlFor="newsletter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        S'abonner à la newsletter
                    </label>
                </div>
            </CardContent>
        </Card>
    );
}
