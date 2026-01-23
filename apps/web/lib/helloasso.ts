export interface HelloAssoTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export interface HelloAssoCheckoutIntentResponse {
    id: number;
    redirectUrl: string;
}

export async function getHelloAssoToken(): Promise<string> {
    const clientId = process.env.HELLOASSO_CLIENT_ID;
    const clientSecret = process.env.HELLOASSO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("HELLOASSO_CLIENT_ID or HELLOASSO_CLIENT_SECRET is not defined");
    }

    const response = await fetch("https://api.helloasso.com/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("HelloAsso Auth Error:", error);
        throw new Error(`Failed to get HelloAsso token: ${response.statusText}`);
    }

    const data: HelloAssoTokenResponse = await response.json();
    return data.access_token;
}

export async function createHelloAssoCheckoutIntent(params: {
    totalAmount: number;
    initialAmount?: number;
    itemName: string;
    backUrl: string;
    errorUrl: string;
    returnUrl: string;
    containsDonation: boolean;
    metadata?: Record<string, any>;
}): Promise<HelloAssoCheckoutIntentResponse> {
    const token = await getHelloAssoToken();
    const slug = process.env.HELLOASSO_ORGANIZATION_SLUG;

    if (!slug) {
        throw new Error("HELLOASSO_ORGANIZATION_SLUG is not defined");
    }

    // Ensure amounts are integers
    const totalAmount = Math.round(params.totalAmount);
    const initialAmount = params.initialAmount ? Math.round(params.initialAmount) : totalAmount;

    // HelloAsso requires HTTPS for all redirect URLs
    const checkHttps = (url: string, name: string) => {
        if (!url.startsWith("https://")) {
            console.warn(`HelloAsso warning: ${name} should start with https://. Current value: ${url}`);
        }
    };

    checkHttps(params.backUrl, "backUrl");
    checkHttps(params.errorUrl, "errorUrl");
    checkHttps(params.returnUrl, "returnUrl");

    const bodyObj: any = {
        totalAmount,
        initialAmount,
        itemName: params.itemName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), // Remove accents
        backUrl: params.backUrl,
        errorUrl: params.errorUrl,
        returnUrl: params.returnUrl,
        containsDonation: params.containsDonation,
    };

    if (params.metadata) {
        bodyObj.metadata = params.metadata;
    }

    const body = JSON.stringify(bodyObj);

    console.log("HelloAsso Request Body:", body);

    const response = await fetch(`https://api.helloasso.com/v5/organizations/${slug}/checkout-intents`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("HelloAsso Checkout Intent Error Status:", response.status);
        console.error("HelloAsso Checkout Intent Error Body:", errorText);
        throw new Error(`Failed to create HelloAsso checkout intent: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Some versions of the API return 'url' instead of 'redirectUrl'
    return {
        id: data.id,
        redirectUrl: data.redirectUrl || data.url
    };
}
